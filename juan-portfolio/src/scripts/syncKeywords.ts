import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import type { Payload } from 'payload'
import config from '../payload.config'
import { SerpApiAdapter } from './seo/adapters/SerpApiAdapter'
import { SerpCache } from './seo/SerpCache'
import { KeywordIntelligenceService } from './seo/WordCountCrawler'
import { Post, Page, KeywordMetric } from '../payload-types'
import { loadState as loadDinoState } from './create-post'
import {
  scrapeWithRetry,
  loadCache as loadDinoCache,
  saveCache as saveDinoCache,
  isCacheValid as isDinoCacheValid,
  type KWCacheEntry,
} from './scrape-dinorank'

const KEYWORDS_FILE = path.resolve(process.cwd(), 'content/keywords.md')
const cache = new SerpCache()
const intelService = new KeywordIntelligenceService()

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
}

export interface KeywordData {
  keyword: string
  targetURL: string
  language?: string
  country?: string
  volume: number
  difficulty: number
  trend?: string
  intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational' | string
  status?: string
  lastUpdated?: string
  source: string
  relatedSearches?: string[]
  paaCount?: number
  paaQuestions?: string[]
  topDomain?: string
  hasAiOverview?: boolean
  aiOverviewSnippet?: string
  serpFeatures?: string[]
  competitorHeadings?: string
  competitorMeta?: string
  avgWordCount?: number
  opportunityScore?: number
  recommendedFormat?: string
  clusterType?: 'Pillar' | 'Supporting' | string
  suggestedAnchorText?: string
  funnelStage?: 'Awareness (TOFU)' | 'Consideration (MOFU)' | 'Decision (BOFU)' | string
  informationGain?: string
  post?: string
  page?: string
  competitorData?: { title: string; snippet: string; link: string }[]
}

const unescapeFromTable = (text: string): string => {
  if (!text) return ''
  return text.replace(/\\\|/g, '|')
}

const sanitizeForTable = (text: string | undefined | null): string => {
  if (!text) return ''
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ').trim()
}

// Global variable to store active headers for formatLine
let activeHeaders: string[] = []

function formatLine(data: KeywordData): string {
  const formatArray = (arr: string[] | undefined): string => (arr || []).join('; ')
  const formatBoolean = (val: boolean | undefined): string => (val ? 'Yes' : 'No')

  if (!activeHeaders.length) {
    // Fallback if headers weren't parsed (should not happen)
    activeHeaders = [
      'Keyword',
      'Target URL',
      'Language',
      'Country',
      'Volume',
      'Difficulty',
      'Trend',
      'Intent',
      'Status',
      'Last Updated',
      'Source',
      'Related Searches',
      'PAA Count',
      'PAA Questions',
      'Top Domain',
      'Has AI Overview',
      'SERP Features',
      'Competitor Headings',
      'Competitor Meta',
      'Avg. Word Count',
      'Opportunity Score',
      'Recommended Format',
      'Cluster Type',
      'Suggested Anchor Text',
      'Funnel Stage',
      'Information Gain',
    ]
  }

  const cols = new Array(activeHeaders.length).fill('')

  const setCol = (name: string, value: string) => {
    const idx = activeHeaders.indexOf(name)
    if (idx !== -1) cols[idx] = value
  }

  setCol('keyword', sanitizeForTable(data.keyword))
  setCol('target url', sanitizeForTable(data.targetURL))
  setCol('language', sanitizeForTable(data.language))
  setCol('country', sanitizeForTable(data.country))
  setCol('volume', (data.volume ?? 0).toString())
  setCol('difficulty', (data.difficulty ?? 0).toString())
  setCol('trend', sanitizeForTable(data.trend))
  setCol('intent', sanitizeForTable(data.intent))
  setCol('status', sanitizeForTable(data.status))
  setCol('last updated', sanitizeForTable(data.lastUpdated))
  setCol('source', sanitizeForTable(data.source))
  setCol('related searches', formatArray(data.relatedSearches))
  setCol('paa count', (data.paaCount ?? 0).toString())
  setCol('paa questions', formatArray(data.paaQuestions))
  setCol('top domain', sanitizeForTable(data.topDomain))
  setCol('has ai overview', formatBoolean(data.hasAiOverview))
  setCol('serp features', formatArray(data.serpFeatures))
  setCol('competitor headings', sanitizeForTable(data.competitorHeadings))
  setCol('competitor meta', sanitizeForTable(data.competitorMeta))
  setCol('avg. word count', (data.avgWordCount ?? 0).toString())
  setCol('opportunity score', (data.opportunityScore ?? 0).toString())
  setCol('recommended format', sanitizeForTable(data.recommendedFormat))
  setCol('cluster type', sanitizeForTable(data.clusterType))
  setCol('suggested anchor text', sanitizeForTable(data.suggestedAnchorText))
  setCol('funnel stage', sanitizeForTable(data.funnelStage))
  setCol('information gain', sanitizeForTable(data.informationGain))

  return `| ${cols.join(' | ')} |`
}

const getDocumentFromURL = async (
  payload: Payload,
  url: string,
): Promise<{
  id: string
  collection: 'posts' | 'pages'
  status: string
  fullUrl: string
} | null> => {
  if (!url || url === 'N/A' || url === '') return null

  const parts = url.split('/')
  const slug = parts[parts.length - 1]

  if (!slug) return null

  // Try posts first
  const posts = await payload.find({
    collection: 'posts',
    where: {
      slug: { equals: slug },
    },
    limit: 1,
  })

  if (posts.docs.length > 0) {
    const doc = posts.docs[0] as unknown as Post & { idioma?: 'en' | 'es' }
    const localePrefix = doc.idioma === 'en' ? '/en' : ''
    return {
      id: String(doc.id),
      collection: 'posts',
      status: String(doc._status),
      fullUrl: `${localePrefix}/blog/${doc.slug}`,
    }
  }

  // Then try pages
  const pages = await payload.find({
    collection: 'pages',
    where: {
      slug: { equals: slug },
    },
    limit: 1,
  })

  if (pages.docs.length > 0) {
    const doc = pages.docs[0] as unknown as Page
    return {
      id: String(doc.id),
      collection: 'pages',
      status: String(doc._status),
      fullUrl: `/${doc.slug}`,
    }
  }

  return null
}

export const parseKeywordsMarkdown = (content: string): KeywordData[] => {
  const lines = content.split(/\r?\n/)
  const keywords: KeywordData[] = []

  const dividerIndex = lines.findIndex((l) => l.includes('---'))
  if (dividerIndex === -1) return []

  const headerLine = lines[dividerIndex - 1]
  if (!headerLine || !headerLine.startsWith('|')) {
    console.warn(
      `${colors.yellow}⚠️  No header line found before divider. Using default headers.${colors.reset}`,
    )
    activeHeaders = [] // Reset to use fallback in formatLine
  } else {
    activeHeaders = headerLine
      .split(/(?<!\\)\|/)
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean)
  }

  const dataLines = lines.slice(dividerIndex + 1)

  for (const line of dataLines) {
    if (!line.trim() || !line.startsWith('|')) continue

    const parts = line.split(/(?<!\\)\|/).map((p) => p.trim())
    if (parts.length > 0 && parts[0] === '') parts.shift()
    if (parts.length > 0 && parts[parts.length - 1] === '') parts.pop()

    if (parts.length < 7) continue

    const keyword = unescapeFromTable(parts[activeHeaders.indexOf('keyword')])
    if (!keyword || keyword === 'Keyword') continue

    const parseArr = (s: string) =>
      s
        .split(';')
        .map((x) => x.trim())
        .filter(Boolean)

    const getValue = (header: string, defaultValue: any = '') => {
      const idx = activeHeaders.indexOf(header.toLowerCase())
      return idx !== -1 && parts[idx] !== undefined ? unescapeFromTable(parts[idx]) : defaultValue
    }

    const getNumber = (header: string, defaultValue: number = 0) => {
      const val = getValue(header)
      return parseInt(val, 10) || defaultValue
    }

    const getBoolean = (header: string, defaultValue: boolean = false) => {
      const val = getValue(header)
      return val === 'Yes' || defaultValue
    }

    const getArray = (header: string) => parseArr(getValue(header))

    keywords.push({
      keyword,
      targetURL: getValue('target url'),
      language: getValue('language'),
      country: getValue('country'),
      volume: getNumber('volume'),
      difficulty: getNumber('difficulty'),
      trend: getValue('trend'),
      intent: getValue('intent') as KeywordData['intent'],
      status: getValue('status'),
      lastUpdated: getValue('last updated'),
      source: getValue('source', 'Manual'),
      relatedSearches: getArray('related searches'),
      paaCount: getNumber('paa count'),
      paaQuestions: getArray('paa questions'),
      topDomain: getValue('top domain'),
      hasAiOverview: getBoolean('has ai overview'),
      aiOverviewSnippet: getValue('ai overview snippet'),
      serpFeatures: getArray('serp features'),
      competitorHeadings: getValue('competitor headings'),
      competitorMeta: getValue('competitor meta'),
      avgWordCount: getNumber('avg. word count'),
      opportunityScore: getNumber('opportunity score'),
      recommendedFormat: getValue('recommended format'),
      clusterType: getValue('cluster type') as KeywordData['clusterType'],
      suggestedAnchorText: getValue('suggested anchor text'),
      funnelStage: getValue('funnel stage') as KeywordData['funnelStage'],
      informationGain: getValue('information gain'),
    })
  }

  return keywords
}

const detectKeywordLocale = (keyword: string): string => {
  if (/[áéíóúüñ¿¡]/i.test(keyword)) return 'es'
  if (/\b(de|en|el|la|los|las|para|como|que|es|del|con|por|una|sus|qué|cómo)\b/i.test(keyword))
    return 'es'
  return 'en'
}

export async function enrichWithSerpData(
  keywords: KeywordData[],
  adapter: SerpApiAdapter,
  delayMs = 1200,
  verbose = false,
): Promise<{ enriched: number; failed: number }> {
  let enriched = 0
  let failed = 0
  const total = keywords.length

  for (let i = 0; i < keywords.length; i++) {
    const kwData = keywords[i]
    const locale = detectKeywordLocale(kwData.keyword)

    if (verbose) {
      process.stdout.write(
        `${colors.dim}[${i + 1}/${total}]${colors.reset} ${colors.blue}Processing${colors.reset} "${kwData.keyword}" ${colors.dim}(${locale})${colors.reset}... `,
      )
    }

    try {
      let metrics = cache.get(kwData.keyword, locale) as Awaited<
        ReturnType<SerpApiAdapter['fetchMetrics']>
      >

      if (!metrics) {
        if (verbose) process.stdout.write(`${colors.yellow}API${colors.reset}... `)
        metrics = await adapter.fetchMetrics(kwData.keyword, locale)
        if (metrics) {
          cache.set(kwData.keyword, locale, metrics)
          if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))
        }
      } else {
        if (verbose) process.stdout.write(`${colors.green}Cache${colors.reset}... `)
      }

      if (metrics) {
        kwData.paaQuestions = metrics.paaQuestions
        kwData.paaCount = metrics.paaCount || metrics.paaQuestions?.length || 0
        kwData.hasAiOverview = metrics.hasAiOverview
        kwData.aiOverviewSnippet = metrics.aiOverviewSnippet
        kwData.volume = metrics.volume || kwData.volume
        kwData.difficulty = metrics.difficulty || kwData.difficulty
        if (metrics.relatedSearches) kwData.relatedSearches = metrics.relatedSearches
        if (metrics.serpFeatures) kwData.serpFeatures = metrics.serpFeatures

        if (metrics.topUrls && metrics.topUrls.length > 0) {
          // Store Top 4 URLs
          kwData.topDomain = metrics.topUrls.slice(0, 4).join('; ')

          if (verbose) process.stdout.write(`${colors.cyan}Intel${colors.reset}... `)
          // Robust Intelligence Gathering (Average Word Count + Real Headings)
          const intel = await intelService.getCompetitorMetrics(metrics.topUrls, 5)
          kwData.avgWordCount = intel.avgWordCount
          // FORCE UPDATE: Overwrite previous mock/duplicate headings
          kwData.competitorHeadings = intel.combinedHeadings
        }

        if (metrics.competitorData) {
          const newMeta = metrics.competitorData
            .slice(0, 3)
            .map((c: { title: string; snippet: string }) => `[${c.title}] ${c.snippet}`)
            .join(' || ')
          if (newMeta && newMeta.length > 10) kwData.competitorMeta = newMeta
        }

        enriched++
        if (verbose) console.log(`${colors.green}Done${colors.reset}`)
      } else {
        if (verbose) console.log(`${colors.red}No Data${colors.reset}`)
        failed++
      }
    } catch (_e) {
      if (verbose) console.log(`${colors.red}Error${colors.reset}`)
      console.error(`❌ SerpAPI/Intel error for "${kwData.keyword}":`, _e)
      failed++
    }
  }

  return { enriched, failed }
}

export async function enrichWithDinoRank(
  keywords: KeywordData[],
  useAI = false,
  verbose = false,
): Promise<{ enriched: number; failed: number }> {
  let enriched = 0
  let failed = 0

  const dinoCache = loadDinoCache()
  const uncachedByCountry: Record<string, string[]> = {}

  for (const kwData of keywords) {
    const country = kwData.country || 'es'
    const cacheKey = `${kwData.keyword.toLowerCase()}_${country}`
    const cachedData = dinoCache[cacheKey]

    if (cachedData && isDinoCacheValid(cachedData.timestamp)) {
      kwData.volume = parseInt(cachedData.volume.replace(/\\D/g, ''), 10) || kwData.volume
      const compRaw = parseFloat(cachedData.competency.replace(',', '.'))
      if (!isNaN(compRaw)) {
        kwData.difficulty = Math.round(compRaw * 100)
      } else {
        kwData.difficulty = parseInt(cachedData.competency, 10) || kwData.difficulty
      }

      if (cachedData.trend && cachedData.trend.length) {
        kwData.trend = cachedData.trend.join(',')
      }

      if (cachedData.relatedSearches) {
        kwData.relatedSearches = cachedData.relatedSearches.split(',').map((s) => s.trim())
      }

      enriched++
      if (verbose) console.log(`${colors.green}Cached DinoRank${colors.reset} "${kwData.keyword}"`)
    } else {
      if (!uncachedByCountry[country]) uncachedByCountry[country] = []
      uncachedByCountry[country].push(kwData.keyword)
    }
  }

  const dinoState = loadDinoState()

  for (const [country, kws] of Object.entries(uncachedByCountry)) {
    if (kws.length === 0) continue

    if (verbose) {
      console.log(
        `${colors.blue}Scraping DinoRank for ${kws.length} keywords in country ${country}...${colors.reset}`,
      )
    }

    try {
      const scraped = await scrapeWithRetry(kws, country, dinoState, useAI)

      for (const res of scraped) {
        const cKey = `${res.keyword.toLowerCase()}_${res.country || country}`
        dinoCache[cKey] = res

        // Find corresponding kwData. Note that AI suggestions might not match our exact keywords.
        const kwData = keywords.find((k) => k.keyword.toLowerCase() === res.keyword.toLowerCase())
        if (kwData) {
          kwData.volume = parseInt(res.volume.replace(/\\D/g, ''), 10) || kwData.volume
          const compRaw = parseFloat(res.competency.replace(',', '.'))
          if (!isNaN(compRaw)) {
            kwData.difficulty = Math.round(compRaw * 100)
          } else {
            kwData.difficulty = parseInt(res.competency, 10) || kwData.difficulty
          }

          if (res.trend && res.trend.length) {
            kwData.trend = res.trend.join(',')
          }

          if (res.relatedSearches) {
            kwData.relatedSearches = res.relatedSearches.split(',').map((s) => s.trim())
          }

          enriched++
        }
      }
      saveDinoCache(dinoCache)
    } catch (_e) {
      if (verbose) console.error(`❌ DinoRank scrape error for country ${country}:`, _e)
      failed += kws.length
    }
  }

  return { enriched, failed }
}

/**
 * Lightweight enrichment: only fetches PAA questions for each keyword.
 * Unlike `enrichWithSerpData`, this function only updates `paaQuestions`/`paaCount`
 * and always uses the `'en'` locale. Useful for targeted PAA updates.
 */
export async function enrichWithFaqs(
  keywords: KeywordData[],
  adapter: {
    fetchMetrics: (
      keyword: string,
      locale?: string,
    ) => Promise<{ paaQuestions?: string[]; paaCount?: number } | null>
  },
  delayMs = 1200,
): Promise<{ enriched: number; failed: number }> {
  let enriched = 0
  let failed = 0

  for (const kwData of keywords) {
    try {
      const metrics = await adapter.fetchMetrics(kwData.keyword, 'en')

      if (metrics && metrics.paaQuestions && metrics.paaQuestions.length > 0) {
        kwData.paaQuestions = metrics.paaQuestions
        kwData.paaCount = metrics.paaCount ?? metrics.paaQuestions.length
        enriched++
      }

      if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))
    } catch (_e) {
      failed++
    }
  }

  return { enriched, failed }
}

const syncKeywords = async () => {
  const args = process.argv.slice(2)
  const fetchSerp = args.includes('--fetch-serp')
  const fetchDinorank = args.includes('--fetch-dinorank')
  const useAI = args.includes('--ai')
  const verbose = args.includes('--verbose')

  console.log(`${colors.blue}⏳ Initializing Payload...${colors.reset}`)
  const payload = await getPayload({ config })

  if (!fs.existsSync(KEYWORDS_FILE)) {
    console.error(`${colors.red}❌ Keywords file not found: ${KEYWORDS_FILE}${colors.reset}`)
    process.exit(1)
  }

  const content = fs.readFileSync(KEYWORDS_FILE, 'utf-8')
  const keywords = parseKeywordsMarkdown(content)
  console.log(`${colors.dim}   Loaded ${keywords.length} keywords from local file${colors.reset}`)

  if (fetchSerp) {
    if (!process.env.SERPAPI_API_KEY) {
      console.warn(`${colors.yellow}⚠️  --fetch-serp requires SERPAPI_API_KEY${colors.reset}`)
    } else {
      const adapter = new SerpApiAdapter()
      await enrichWithSerpData(keywords, adapter, 1200, verbose)
    }
  }

  if (fetchDinorank) {
    await enrichWithDinoRank(keywords, useAI, verbose)
  }

  console.log(`\n${colors.blue}🔄 Syncing to Payload & Checking Live Status...${colors.reset}`)

  let updatedCount = 0
  for (const kwData of keywords) {
    try {
      const linkedDoc = await getDocumentFromURL(payload, kwData.targetURL)
      if (linkedDoc) {
        kwData.post = linkedDoc.collection === 'posts' ? linkedDoc.id : undefined
        kwData.page = linkedDoc.collection === 'pages' ? linkedDoc.id : undefined

        if (linkedDoc.status === 'published') {
          kwData.status = `LIVE: ${linkedDoc.fullUrl}`
        } else {
          kwData.status = linkedDoc.status.toUpperCase()
        }
      }

      const existing = await payload.find({
        collection: 'keyword-metrics',
        where: { keyword: { equals: kwData.keyword } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        await payload.update({
          collection: 'keyword-metrics',
          id: existing.docs[0].id,
          data: kwData as unknown as KeywordMetric,
        })
      } else {
        await payload.create({
          collection: 'keyword-metrics',
          data: kwData as unknown as KeywordMetric,
        })
      }
      updatedCount++
    } catch (_e) {
      console.error(`❌ Error syncing "${kwData.keyword}":`, _e)
    }
  }

  console.log(`\n${colors.blue}💾 Updating local ${KEYWORDS_FILE}...${colors.reset}`)
  const lines = content.split(/\r?\n/)
  const updatedLines: string[] = []
  let headerProcessed = false
  let separatorProcessed = false
  const resultsMap = new Map(keywords.map((k) => [k.keyword.toLowerCase(), k]))

  for (const line of lines) {
    if (!line.trim()) {
      updatedLines.push(line)
      continue
    }
    if (line.includes('| Keyword') && line.trim().startsWith('|')) {
      updatedLines.push(line)
      headerProcessed = true
      continue
    }
    if (headerProcessed && !separatorProcessed && line.includes('---')) {
      updatedLines.push(line)
      separatorProcessed = true
      continue
    }
    if (headerProcessed && separatorProcessed && line.trim().startsWith('|')) {
      const parts = line.split(/(?<!\\)\|/).map((p) => p.trim())
      if (parts.length > 0 && parts[0] === '') parts.shift()
      const kw = unescapeFromTable(parts[0]).toLowerCase()
      const enriched = resultsMap.get(kw)
      if (enriched) {
        updatedLines.push(formatLine(enriched))
        resultsMap.delete(kw)
      } else {
        updatedLines.push(line)
      }
    } else {
      updatedLines.push(line)
    }
  }

  for (const remaining of resultsMap.values()) {
    updatedLines.push(formatLine(remaining))
  }

  fs.writeFileSync(KEYWORDS_FILE, updatedLines.join('\n'))
  console.log(
    `${colors.green}✅ Sync and Update complete! (${updatedCount} keywords)${colors.reset}`,
  )

  process.exit(0)
}

syncKeywords()
