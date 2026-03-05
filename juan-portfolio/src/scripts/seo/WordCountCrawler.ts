import { JSDOM, VirtualConsole } from 'jsdom'
import pLimit from 'p-limit'

const CRAWL_TIMEOUT_MS = 15000
const MAX_CONCURRENT_CRAWLS = 2 // Reduced for stability

const virtualConsole = new VirtualConsole()
virtualConsole.on('error', () => {})
virtualConsole.on('warn', () => {})

export interface CrawlResult {
  wordCount: number
  headings: string[]
  metaTitle: string
  metaDescription: string
  url: string
}

export class KeywordIntelligenceService {
  private limit = pLimit(MAX_CONCURRENT_CRAWLS)

  async crawlUrl(url: string): Promise<CrawlResult> {
    if (url.toLowerCase().endsWith('.pdf') || url.toLowerCase().endsWith('.xml') || url.toLowerCase().endsWith('.txt')) {
      return { wordCount: 0, headings: [], metaTitle: '', metaDescription: '', url }
    }
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), CRAWL_TIMEOUT_MS)

    try {
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      })
      
      if (!response.ok) throw new Error(`Status ${response.status}`)
      const html = await response.text()

      const dom = new JSDOM(html, { virtualConsole })
      const doc = dom.window.document

      // Extract Meta
      const metaTitle = doc.querySelector('title')?.textContent?.trim() || ''
      const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || 
                             doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() || ''

      // Remove noise
      const tagsToRemove = ['script', 'style', 'nav', 'footer', 'header', 'iframe', 'noscript', 'svg']
      tagsToRemove.forEach(tag => {
        const elements = doc.querySelectorAll(tag)
        elements.forEach((el: any) => el.remove())
      })

      // Count words in main content areas
      const mainContent = doc.querySelector('main, article, #content, .content, .post-content') || doc.body
      const text = mainContent.textContent || ''
      const wordCount = text.split(/\s+/).filter((w: string) => w.length > 1).length

      // Extract headings with tags
      const headings = Array.from(doc.querySelectorAll('h1, h2, h3'))
        .map((h: any) => `${h.tagName.toUpperCase()}: ${h.textContent?.trim() || ''}`)
        .filter(h => h.length > 10)
        .slice(0, 12)

      return { wordCount, headings, metaTitle, metaDescription, url }
    } catch (err) {
      return { wordCount: 0, headings: [], metaTitle: '', metaDescription: '', url }
    } finally {
      clearTimeout(timeout)
    }
  }

  async getCompetitorMetrics(urls: string[], maxUrls = 5): Promise<{ avgWordCount: number; combinedHeadings: string; combinedMetas: string }> {
    const targetUrls = urls.slice(0, maxUrls)
    const results = await Promise.all(
      targetUrls.map(url => this.limit(() => this.crawlUrl(url)))
    )

    const validResults = results.filter(r => r.wordCount > 50)
    if (validResults.length === 0) return { avgWordCount: 0, combinedHeadings: '', combinedMetas: '' }

    const totalWords = validResults.reduce((acc, r) => acc + r.wordCount, 0)
    const avgWordCount = Math.round(totalWords / validResults.length)
    
    const combinedHeadings = validResults
      .map((r, i) => `[U${i + 1}] ${r.headings.join(' - ')}`)
      .join(' || ')

    const combinedMetas = validResults
      .map((r, i) => `[U${i + 1}] Title: ${r.metaTitle} | Desc: ${r.metaDescription}`)
      .join(' || ')

    return { avgWordCount, combinedHeadings, combinedMetas }
  }
}
