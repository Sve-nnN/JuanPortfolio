import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../payload.config'
import { DataForSeoAdapter } from './seo/adapters/DataForSeoAdapter'
import { GoogleAdsAdapter } from './seo/adapters/GoogleAdsAdapter'
import { SerpApiAdapter } from './seo/adapters/SerpApiAdapter'
import { SeoAdapter } from './seo/types'
import { JSDOM } from 'jsdom'
import enquirer from 'enquirer'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { MultiSelect } = enquirer as any

// --- Configuration ---
const KEYWORDS_FILE_PATH = path.join(process.cwd(), 'content', 'keywords.md')

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
}

// --- Interfaces ---

interface KeywordData {
  keyword: string
  targetUrl: string
  volume: number
  difficulty: number
  intent: string
  status: string
  lastUpdated: string
  source: string
  relatedSearches: string[]
  paaCount: number
  paaQuestions?: string[]
  topDomain: string
  hasAiOverview: boolean
  serpFeatures: string[]
  competitorHeadings: string
  competitorMeta: string
  opportunityScore: number
  recommendedFormat: string
  clusterType: string
  suggestedAnchorText: string
}

// --- Helper Functions ---

function getSeoAdapter(preferredSource?: string): SeoAdapter {
  if (preferredSource) {
    switch (preferredSource.toLowerCase()) {
      case 'google-ads':
        if (process.env.GOOGLE_ADS_DEVELOPER_TOKEN) return new GoogleAdsAdapter()
        break
      case 'serpapi':
        if (process.env.SERPAPI_API_KEY) return new SerpApiAdapter()
        break
      case 'dataforseo':
        if (process.env.DATAFORSEO_LOGIN) return new DataForSeoAdapter()
        break
      case 'mock':
        return createMockAdapter()
    }
  }

  if (process.env.SERPAPI_API_KEY) return new SerpApiAdapter()
  if (process.env.GOOGLE_ADS_DEVELOPER_TOKEN) return new GoogleAdsAdapter()

  return createMockAdapter()
}

function createMockAdapter(): SeoAdapter {
  return {
    providerName: 'Mock',
    async fetchMetrics(keyword: string) {
      await new Promise((resolve) => setTimeout(resolve, 50))
      return {
        volume: ((keyword.length * 100) % 5000) + 50,
        difficulty: (keyword.length * 7) % 100,
        topUrls: ['https://example.com/blog/test-1', 'https://example.com/blog/test-2'],
      }
    },
  }
}

/**
 * Sanitizes text for safe inclusion in a Markdown table.
 */
function sanitizeForTable(text: string): string {
  if (!text) return ''
  return text
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Removes escapes from Markdown table text.
 */
function unescapeFromTable(text: string): string {
  if (!text) return ''
  return text.replace(/\\\|/g, '|')
}

function parseLine(line: string): KeywordData | null {
  const parts = line.split(/(?<!\\)\|/).map((p) => p.trim())

  if (parts.length > 0 && parts[0] === '') parts.shift()
  if (parts.length > 0 && parts[parts.length - 1] === '') parts.pop()

  if (parts.length < 7) return null

  const parseArray = (str: string): string[] => {
    if (!str || str === '') return []
    return unescapeFromTable(str)
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s)
  }

  return {
    keyword: unescapeFromTable(parts[0] || ''),
    targetUrl: unescapeFromTable(parts[1] || ''),
    volume: parseInt(parts[2]) || 0,
    difficulty: parseInt(parts[3]) || 0,
    intent: unescapeFromTable(parts[4] || ''),
    status: unescapeFromTable(parts[5] || ''),
    lastUpdated: unescapeFromTable(parts[6] || ''),
    source: unescapeFromTable(parts[7] || ''),
    relatedSearches: parseArray(parts[8] || ''),
    paaCount: parseInt(parts[9]) || 0,
    topDomain: unescapeFromTable(parts[10] || ''),
    hasAiOverview: parts[11] === 'Yes',
    serpFeatures: parseArray(parts[12] || ''),
    competitorHeadings: unescapeFromTable(parts[13] || ''),
    competitorMeta: unescapeFromTable(parts[14] || ''),
    opportunityScore: parseInt(parts[15]) || 0,
    recommendedFormat: unescapeFromTable(parts[16] || ''),
    clusterType: unescapeFromTable(parts[17] || ''),
    suggestedAnchorText: unescapeFromTable(parts[18] || ''),
  }
}

function formatLine(data: KeywordData): string {
  const formatArray = (arr: string[]): string => arr.join('; ')
  const formatBoolean = (val: boolean): string => (val ? 'Yes' : 'No')

  const columns = [
    sanitizeForTable(data.keyword),
    sanitizeForTable(data.targetUrl),
    data.volume.toString(),
    data.difficulty.toString(),
    sanitizeForTable(data.intent),
    sanitizeForTable(data.status),
    sanitizeForTable(data.lastUpdated),
    sanitizeForTable(data.source),
    formatArray(data.relatedSearches),
    data.paaCount.toString(),
    sanitizeForTable(data.topDomain),
    formatBoolean(data.hasAiOverview),
    formatArray(data.serpFeatures),
    sanitizeForTable(data.competitorHeadings),
    sanitizeForTable(data.competitorMeta),
    data.opportunityScore.toString(),
    sanitizeForTable(data.recommendedFormat),
    sanitizeForTable(data.clusterType),
    sanitizeForTable(data.suggestedAnchorText),
  ]

  return `| ${columns.join(' | ')} |`
}

async function crawlCompetitorContent(urls: string[]): Promise<{ headings: string; meta: string }> {
  const results: Array<{ headings: string; meta: string }> = []
  const MAX_SUCCESSES = 4

  for (const url of urls) {
    if (results.length >= MAX_SUCCESSES) break

    try {
      process.stdout.write(
        `${colors.dim}    - Crawling (${results.length + 1}/${MAX_SUCCESSES}): ${url.substring(0, 50)}...${colors.reset}`,
      )

      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        },
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const html = await response.text()
      const dom = new JSDOM(html)
      const doc = dom.window.document

      const headings = Array.from(doc.querySelectorAll('h2, h3'))
        .map((h) => `${h.tagName.toUpperCase()}: ${h.textContent?.trim()}`)
        .filter((t) => t.length > 10)

      if (headings.length === 0) {
        process.stdout.write(
          `\r${colors.yellow}    ⚠️  Skipped: No headings found at ${url.substring(0, 40)}...    \n${colors.reset}`,
        )
        continue
      }

      const title = doc.querySelector('title')?.textContent?.trim() || 'No Title'
      const description =
        doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ||
        doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() ||
        'No Description'

      const headingSummary = headings.slice(0, 10).join(' - ')
      const metaSummary = `Title: ${title} | Desc: ${description.slice(0, 100)}${description.length > 100 ? '...' : ''}`

      results.push({ headings: headingSummary, meta: metaSummary })
      process.stdout.write(
        `\r${colors.green}    ✅ Success (${results.length}/${MAX_SUCCESSES}): ${url.substring(0, 50)}...    \n${colors.reset}`,
      )
    } catch (e) {
      process.stdout.write(
        `\r${colors.red}    ❌ Failed: ${url.substring(0, 50)}... (${e instanceof Error ? e.message : 'Error'})    \n${colors.reset}`,
      )
    }
  }

  if (results.length === 0) {
    return { headings: 'Crawl Failed (No data found)', meta: 'Crawl Failed' }
  }

  return {
    headings: results.map((r, i) => `[U${i + 1}] ${r.headings}`).join(' || '),
    meta: results.map((r, i) => `[U${i + 1}] ${r.meta}`).join(' || '),
  }
}

async function main() {
  process.stdout.write(`${colors.blue}⏳ Initializing...${colors.reset}`)
  await getPayload({ config })
  process.stdout.write(`\r${colors.green}✅ System Ready.    \n${colors.reset}`)

  if (!fs.existsSync(KEYWORDS_FILE_PATH)) {
    console.error(`${colors.red}❌ Keywords file not found: ${KEYWORDS_FILE_PATH}${colors.reset}`)
    process.exit(1)
  }

  const args = process.argv.slice(2)
  const sourceArg = args.find((arg) => arg.startsWith('--source='))
  const adapter = getSeoAdapter(sourceArg ? sourceArg.split('=')[1] : undefined)

  console.log(`${colors.cyan}${colors.bright}🚀 SEO Metrics Manager${colors.reset}\n`)
  console.log(
    `${colors.dim}Using Adapter: ${colors.reset}${colors.bright}${adapter.providerName}${colors.reset}\n`,
  )

  const fileContent = fs.readFileSync(KEYWORDS_FILE_PATH, 'utf-8')
  const lines = fileContent.split('\n')

  const allKeywords: { data: KeywordData; originalLine: string }[] = []
  let headerLine = ''
  let separatorLine = ''

  for (const line of lines) {
    if (line.includes('| Keyword') && line.trim().startsWith('|')) {
      headerLine = line
      continue
    }
    if (headerLine && !separatorLine && line.includes('---')) {
      separatorLine = line
      continue
    }
    if (headerLine && separatorLine && line.trim().startsWith('|')) {
      const data = parseLine(line)
      if (data && data.keyword) allKeywords.push({ data, originalLine: line })
    }
  }

  if (allKeywords.length === 0) {
    console.log(`${colors.yellow}No keywords found in the file.${colors.reset}`)
    return
  }

  let selectedToUpdate: typeof allKeywords = []

  if (process.stdout.isTTY) {
    try {
      const prompt = new MultiSelect({
        name: 'selected',
        message: 'Select keywords to update:',
        hint: '(Space to toggle, "a" to select all, "i" to invert, Enter to confirm)',
        choices: allKeywords.map((k) => ({
          name: k.data.keyword,
          message: `${k.data.keyword} ${colors.dim}(Last updated: ${k.data.lastUpdated || 'Never'})${colors.reset}`,
          value: k.data.keyword,
        })),
      })

      const selectedNames = await prompt.run()
      selectedToUpdate = allKeywords.filter((k) => selectedNames.includes(k.data.keyword))
    } catch (_e) {
      console.log(`\n${colors.yellow}Operation cancelled.${colors.reset}`)
      return
    }
  } else {
    selectedToUpdate = allKeywords
  }

  if (selectedToUpdate.length === 0) {
    console.log(`${colors.yellow}No keywords selected. Exiting.${colors.reset}`)
    return
  }

  console.log(`\n${colors.blue}📦 Updating ${selectedToUpdate.length} keywords...${colors.reset}\n`)

  const today = new Date().toISOString().split('T')[0]
  const resultsMap = new Map<string, KeywordData>()

  for (const item of selectedToUpdate) {
    const data = item.data
    console.log(`${colors.bright}🔹 Keyword: ${data.keyword}${colors.reset}`)

    try {
      const metrics = await adapter.fetchMetrics(data.keyword)

      if (metrics) {
        data.volume = metrics.volume || data.volume
        data.difficulty = metrics.difficulty !== undefined ? metrics.difficulty : data.difficulty
        data.lastUpdated = today
        data.source = adapter.providerName

        if (metrics.relatedSearches?.length) data.relatedSearches = metrics.relatedSearches
        if (metrics.paaCount !== undefined) data.paaCount = metrics.paaCount
        if (metrics.paaQuestions?.length) data.paaQuestions = metrics.paaQuestions
        if (metrics.topDomain) data.topDomain = metrics.topDomain
        if (metrics.hasAiOverview !== undefined) data.hasAiOverview = metrics.hasAiOverview
        if (metrics.serpFeatures?.length) data.serpFeatures = metrics.serpFeatures

        // 1. Refined Intent Logic
        const kw = data.keyword.toLowerCase()
        if (
          kw.includes('how') ||
          kw.includes('tutorial') ||
          kw.includes('guia') ||
          kw.includes('guide')
        ) {
          data.intent = 'Informational'
        } else if (
          kw.includes('best') ||
          kw.includes('top') ||
          kw.includes('vs') ||
          kw.includes('mejor') ||
          kw.includes('comparativa')
        ) {
          data.intent = 'Commercial'
        } else if (
          kw.includes('comprar') ||
          kw.includes('precio') ||
          kw.includes('price') ||
          kw.includes('buy') ||
          kw.includes('service')
        ) {
          data.intent = 'Transactional'
        } else {
          data.intent = data.intent || 'Informational'
        }

        // 2. Cluster Type Logic (Source of Truth: Hub & Spoke)
        // Pillars: Broad topics, high volume, medium/high difficulty
        if (data.volume > 1000000 && data.difficulty > 20) {
          data.clusterType = 'Pillar'
        } else {
          data.clusterType = 'Supporting'
        }

        // 3. Recommended Format
        if (data.intent === 'Informational') {
          data.recommendedFormat = data.clusterType === 'Pillar' ? 'Technical Guide' : 'Blog'
        } else if (data.intent === 'Commercial') {
          data.recommendedFormat = 'Comparison / Page'
        } else {
          data.recommendedFormat = 'Landing Page'
        }

        // 4. Opportunity Logic (Be more aggressive with low difficulty)
        let score = 0
        if (data.difficulty < 15) {
          score = data.volume > 100 ? 98 : 80 // High score for long-tail
        } else if (data.difficulty < 35) {
          score = data.volume > 5000 ? 90 : 70
        } else {
          score = Math.max(5, Math.min(60, data.volume / 10000))
        }
        data.opportunityScore = score

        // 5. Suggested Anchor Text (Source of Truth formulas)
        const currentYear = new Date().getFullYear()
        const formula1 = `${currentYear} ${data.recommendedFormat} on ${data.keyword}`
        const formula2 = data.keyword
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
        data.suggestedAnchorText = `${formula1} | ${formula2}`

        if (metrics.topUrls?.length) {
          console.log(`    Analyzing top ${metrics.topUrls.length} competitors...`)
          const crawlerResults = await crawlCompetitorContent(metrics.topUrls)

          // Add PAA questions to heading suggestions
          let headings = crawlerResults.headings
          if (data.paaQuestions?.length) {
            const paaHeading = `[PAA] ${data.paaQuestions.slice(0, 5).join(' - ')}`
            headings = `${paaHeading} || ${headings}`
          }

          if (!crawlerResults.headings.includes('Crawl Failed')) {
            data.competitorHeadings = headings
          }
          if (!crawlerResults.meta.includes('Crawl Failed')) {
            data.competitorMeta = crawlerResults.meta
          }
        }

        console.log(
          `    ${colors.green}✅ Success: Vol ${data.volume}, Diff ${data.difficulty}${colors.reset}\n`,
        )
      }
    } catch (e) {
      console.error(
        `    ${colors.red}❌ Error: ${e instanceof Error ? e.message : String(e)}${colors.reset}\n`,
      )
    }
    resultsMap.set(data.keyword, data)
  }

  const updatedLines: string[] = []
  let headerProcessed = false
  let separatorProcessed = false

  for (const line of lines) {
    if (!line.trim()) {
      updatedLines.push(line)
      continue
    }

    if (line.includes('| Keyword') && line.trim().startsWith('|')) {
      updatedLines.push(
        '| Keyword | Target URL | Volume | Difficulty | Intent | Status | Last Updated | Source | Related Searches | PAA Count | Top Domain | Has AI Overview | SERP Features | Competitor Headings | Competitor Meta | Opportunity Score | Recommended Format | Cluster Type | Suggested Anchor Text |',
      )
      headerProcessed = true
      continue
    }
    if (headerProcessed && !separatorProcessed && line.includes('---')) {
      updatedLines.push(
        '| :-------------------------------- | :-------------------------------------------- | :----- | :--------- | :----- | :----- | :----------- | :----- | :--------------- | :-------- | :--------- | :-------------- | :------------ | :------------------ | :-------------- | :---------------- | :----------------- | :----------- | :-------------------- |',
      )
      separatorProcessed = true
      continue
    }

    if (headerProcessed && separatorProcessed && line.trim().startsWith('|')) {
      const parsed = parseLine(line)
      if (parsed && resultsMap.has(parsed.keyword)) {
        updatedLines.push(formatLine(resultsMap.get(parsed.keyword)!))
      } else if (parsed) {
        updatedLines.push(formatLine(parsed))
      } else {
        updatedLines.push(line)
      }
    } else {
      updatedLines.push(line)
    }
  }

  fs.writeFileSync(KEYWORDS_FILE_PATH, updatedLines.join('\n'))
  console.log(
    `${colors.green}${colors.bright}✨ Finished! File updated at ${KEYWORDS_FILE_PATH}${colors.reset}\n`,
  )

  // Ensure the process exits cleanly (Payload connections can keep it alive)
  process.exit(0)
}

main().catch((err) => {
  console.error(`\n${colors.red}Fatal error:${colors.reset}`, err)
  process.exit(1)
})
