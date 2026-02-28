import { JSDOM } from 'jsdom'
import pLimit from 'p-limit'

const CRAWL_TIMEOUT_MS = 15000
const MAX_CONCURRENT_CRAWLS = 2 // Reduced for stability

export interface CrawlResult {
  wordCount: number
  headings: string[]
  url: string
  success: boolean
}

export async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(CRAWL_TIMEOUT_MS),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        },
      })
      if (response.ok) return response
      if (response.status === 403 || response.status === 429) {
        await new Promise(r => setTimeout(r, 2000 * (i + 1)))
      }
    } catch (_e) {
      if (i === retries - 1) throw _e
    }
  }
  throw new Error(`Failed to fetch ${url}`)
}

export async function crawlCompetitor(url: string): Promise<CrawlResult> {
  const result: CrawlResult = { wordCount: 0, headings: [], url, success: false }
  
  if (!url || url.toLowerCase().endsWith('.pdf') || url.includes('youtube.com') || url.includes('youtu.be')) {
    return result
  }
  
  try {
    const response = await fetchWithRetry(url)
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) return result

    const html = await response.text()
    const dom = new JSDOM(html)
    const doc = dom.window.document

    const article = doc.querySelector('article') || doc.querySelector('main') || doc.body
    if (!article) return result

    // Clean up
    const clone = article.cloneNode(true) as HTMLElement
    clone.querySelectorAll('script, style, nav, footer, header, noscript, iframe, .ads, .sidebar, .comments, aside, [style*="display: none"]').forEach(el => el.remove())

    // Extract headings
    const headings = Array.from(clone.querySelectorAll('h2, h3'))
      .map(h => h.textContent?.trim() || '')
      .filter(t => t.length > 5 && t.length < 200)
      .slice(0, 5)

    const text = clone.textContent || ''
    const words = text.trim().split(/\s+/).filter(w => w.length > 1 && !w.startsWith('.') && !w.startsWith('#'))
    
    const count = words.length
    if (count < 150) return result // Skip thin content

    return {
      wordCount: count,
      headings,
      url,
      success: true
    }
  } catch (_e) {
    return result
  }
}

/**
 * Service to manage crawling with Strategy and concurrency control.
 */
export class KeywordIntelligenceService {
  private limit = pLimit(MAX_CONCURRENT_CRAWLS)

  async getCompetitorMetrics(urls: string[], targetCount = 5): Promise<{ avgWordCount: number; combinedHeadings: string }> {
    const results: CrawlResult[] = []
    
    // Process in batches until we hit targetCount or exhaust URLs
    for (let i = 0; i < urls.length && results.length < targetCount; i += MAX_CONCURRENT_CRAWLS) {
      const batch = urls.slice(i, i + MAX_CONCURRENT_CRAWLS)
      const batchResults = await Promise.all(batch.map(url => this.limit(() => crawlCompetitor(url))))
      
      for (const res of batchResults) {
        if (res.success) {
          results.push(res)
          if (results.length >= targetCount) break
        }
      }
    }

    if (results.length === 0) {
      return { avgWordCount: 500, combinedHeadings: 'Crawl failed: no valid HTML content found' }
    }

    const totalWords = results.reduce((sum, r) => sum + r.wordCount, 0)
    const avgWordCount = Math.round(totalWords / results.length)
    
    const combinedHeadings = results
      .map((r, i) => `[U${i + 1}] ${r.headings.join(' - ')}`)
      .join(' || ')

    return { avgWordCount, combinedHeadings }
  }
}
