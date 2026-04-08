import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../../payload.config'

interface CWVMetrics {
  lcp: number | null
  fcp: number | null
  fid: number | null
  inp: number | null
  cls: number | null
  score: number | null
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const fetchSitemapUrls = async (sitemapUrl: string): Promise<string[]> => {
  try {
    const response = await fetch(sitemapUrl)
    if (!response.ok) throw new Error(`Failed to fetch sitemap: ${response.statusText}`)

    const xml = await response.text()
    // Simple regex to extract URLs
    const urls = xml.match(/<loc>(.*?)<\/loc>/g)?.map((val) => val.replace(/<\/?loc>/g, '')) || []

    // Naively check for sub-sitemaps (ends in .xml) and recursive fetch - depth 1 for now to prevent infinite recursion risks in simple script
    const subSitemaps = urls.filter((u) => u.endsWith('.xml') && u !== sitemapUrl)
    const pageUrls = urls.filter((u) => !u.endsWith('.xml'))

    for (const sub of subSitemaps) {
      console.log(`Fetching sub-sitemap: ${sub}`)
      const subUrls = await fetchSitemapUrls(sub)
      pageUrls.push(...subUrls)
    }

    return [...new Set(pageUrls)] // Deduplicate
  } catch (error) {
    console.error('Error fetching sitemap:', error)
    return []
  }
}

export const fetchPageMetrics = async (url: string, apiKey?: string): Promise<CWVMetrics> => {
  try {
    const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed')
    apiUrl.searchParams.append('url', url)
    apiUrl.searchParams.append('strategy', 'mobile')
    apiUrl.searchParams.append('category', 'performance')
    if (apiKey) apiUrl.searchParams.append('key', apiKey)

    const response = await fetch(apiUrl.toString())
    if (!response.ok) {
      // Handle 429 specially? For now just throw.
      throw new Error(`PSI API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const loadingExperience = data.loadingExperience?.metrics
    const lighthouse = data.lighthouseResult?.audits

    // Helper to get metric from Field Data (loadingExperience) or Lab Data (lighthouse)
    const getMetric = (fieldKey: string, lighthouseKey: string, scale = 1): number | null => {
      let val: number | null = null
      // Try Field Data first
      if (loadingExperience?.[fieldKey]?.percentile) {
        val = loadingExperience[fieldKey].percentile / scale
      }
      // Fallback to Lab Data
      else if (lighthouse?.[lighthouseKey]?.numericValue) {
        val = lighthouse[lighthouseKey].numericValue / scale
      }

      if (val !== null) {
        return Math.round(val * 1000) / 1000
      }
      return null
    }

    // CLS in PSI v5 loadingExperience is multiplied by 100 (e.g. 10 = 0.1)
    // CLS in Lighthouse numericValue is unitless (e.g. 0.1)
    // So for Field Data we divide by 100. For Lab Data we keep as is (divide by 1).
    // Actually, let's normalize strictly.

    // LCP: Field (ms), Lab (ms). Return seconds -> / 1000
    const lcp = getMetric('LARGEST_CONTENTFUL_PAINT_MS', 'largest-contentful-paint', 1000)

    // FCP: Field (ms), Lab (ms). Return seconds -> / 1000
    const fcp = getMetric('FIRST_CONTENTFUL_PAINT_MS', 'first-contentful-paint', 1000)

    // FID: Field (ms), Lab (max-potential-fid ms). Return ms -> / 1
    // Note: FID is dead in Lab, usually we use Total Blocking Time (TBT) as proxy in Lab, but let's stick to Max Potential FID if available or null.
    // Lighthouse doesn't strictly have FID. It has 'max-potential-fid' (deprecated) or we leave it null.
    const fid = loadingExperience?.FIRST_INPUT_DELAY_MS?.percentile
      ? Math.round(loadingExperience.FIRST_INPUT_DELAY_MS.percentile * 1000) / 1000
      : null

    // INP: Field (ms). Lab doesn't really have INP yet (it's interaction based).
    const inp = loadingExperience?.INTERACTION_TO_NEXT_PAINT?.percentile
      ? Math.round(loadingExperience.INTERACTION_TO_NEXT_PAINT.percentile * 1000) / 1000
      : null

    // CLS: Field (0.1 gets 10?). Lab (0.1).
    // Field data 'CUMULATIVE_LAYOUT_SHIFT_SCORE' percentile 10 means 0.10.
    // Lab data 'cumulative-layout-shift' numericValue is 0.10.
    let cls = null
    if (loadingExperience?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile) {
      // Field data is * 100
      cls = loadingExperience.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100
    } else if (lighthouse?.['cumulative-layout-shift']?.numericValue) {
      cls = lighthouse['cumulative-layout-shift'].numericValue
    }

    if (cls !== null) cls = Math.round(cls * 1000) / 1000

    return {
      lcp,
      fcp,
      fid,
      inp,
      cls,
      score: data.lighthouseResult?.categories?.performance?.score
        ? Math.round(data.lighthouseResult.categories.performance.score * 100)
        : null,
    }
  } catch (error) {
    console.error(`Error fetching metrics for ${url}:`, error)
    return { lcp: null, fcp: null, fid: null, inp: null, cls: null, score: null }
  }
}

export const saveMetricsToPayload = async (url: string, metrics: CWVMetrics) => {
  const payload = await getPayload({ config })

  let pathStr = '/'
  try {
    pathStr = new URL(url).pathname
  } catch (_e) {}

  const existing = await payload.find({
    collection: 'page-metrics',
    where: {
      url: {
        equals: url,
      },
    },
    limit: 1,
  })

  // Skip update if no metrics found (prevent clearing data on API failure)
  if (metrics.score === null && metrics.lcp === null) {
    console.warn(`Skipping update for ${url} - no metrics returned`)
    return
  }

  if (existing.totalDocs > 0) {
    const doc = existing.docs[0]
    const history = doc.history || []
    if (doc.mobile) {
      history.push({
        date: new Date().toISOString(),
        metrics: doc.mobile,
      })
    }

    if (history.length > 30) history.shift() // Keep last 30 scans

    await payload.update({
      collection: 'page-metrics',
      id: doc.id,
      data: {
        lastScan: new Date().toISOString(),
        mobile: metrics,
        history,
      },
    })
  } else {
    await payload.create({
      collection: 'page-metrics',
      data: {
        url,
        path: pathStr,
        lastScan: new Date().toISOString(),
        mobile: metrics,
        history: [],
      },
    })
  }
}

const shouldScan = (lastScan: string | undefined | null, force: boolean): boolean => {
  if (force) return true
  if (!lastScan) return true

  const lastDate = new Date(lastScan)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - lastDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays >= 7
}

export const updateAllCWV = async (force: boolean = false) => {
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const sitemapUrl = `${serverUrl}/sitemap.xml` // Next.js sitemap default
  const apiKey = process.env.GOOGLE_PSI_API_KEY // Optional

  console.log(`Starting CWV Update... fetching sitemap from ${sitemapUrl}`)
  const urls = await fetchSitemapUrls(sitemapUrl)
  console.log(`Found ${urls.length} URLs to scan.`)

  // Pre-init payload to check existing dates
  const payload = await getPayload({ config })

  for (const [i, url] of urls.entries()) {
    // Check if we need to scan
    const existing = await payload.find({
      collection: 'page-metrics',
      where: {
        url: {
          equals: url,
        },
      },
      limit: 1,
    })

    const lastScan = existing.docs[0]?.lastScan

    if (!shouldScan(lastScan, force)) {
      console.log(`[${i + 1}/${urls.length}] Skipping ${url} (Scanned recently: ${lastScan})`)
      continue
    }

    console.log(`[${i + 1}/${urls.length}] Scanning ${url}...`)
    const metrics = await fetchPageMetrics(url, apiKey)
    await saveMetricsToPayload(url, metrics)

    // Rate limiting:
    // Quota: 100 queries per 100 seconds per user = 1 query / 1 second.
    // We use 2000ms (0.5 queries/sec) to be safely within the 100q/100s limit.
    console.log('Waiting 2s to respect API quota...')
    await sleep(2000)
  }
  console.log('CWV Update Complete!')
}

// Allow standalone execution
if (import.meta.url === `file://${process.argv[1]}`) {
  updateAllCWV(process.argv.includes('--force'))
    .then(() => process.exit(0))
    .catch((_e) => {
      console.error('Fatal Error:', _e)
      process.exit(1)
    })
}
