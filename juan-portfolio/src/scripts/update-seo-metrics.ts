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
import pLimit from 'p-limit'
import { extractPhrases } from './seo/keyword-utils'
import {
  deriveIntent,
  deriveFunnelStage,
  deriveInformationGain,
  deriveStrategy,
  Intent,
} from './seo/seo-logic'

interface MultiSelectPrompt {
  run(): Promise<string[]>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MultiSelect = (enquirer as any).MultiSelect

// --- Configuration ---
const MAX_CONCURRENT_CRAWLS = 3
const CRAWL_TIMEOUT_MS = 15000
const MAX_SUCCESSFUL_CRAWLS_PER_KEYWORD = 4

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
  avgWordCount: number
  opportunityScore: number
  recommendedFormat: string
  clusterType: string
  suggestedAnchorText: string
  funnelStage: string
  informationGain: string
}

interface CrawlResult {
  headings: string
  meta: string
  wordCount: number
  discoveredKeywords: string[]
  success: boolean
  sgeCitabilityScore: number
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
        topUrls: [
          'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
          'https://web.dev/vitals/'
        ],
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

  const isNewFormat = parts.length >= 20

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
    volume: parseInt(parts[2], 10) || 0,
    difficulty: parseInt(parts[3], 10) || 0,
    intent: unescapeFromTable(parts[4] || ''),
    status: unescapeFromTable(parts[5] || ''),
    lastUpdated: unescapeFromTable(parts[6] || ''),
    source: unescapeFromTable(parts[7] || ''),
    relatedSearches: parseArray(parts[8] || ''),
    paaCount: parseInt(parts[9], 10) || 0,
    topDomain: unescapeFromTable(parts[10] || ''),
    hasAiOverview: parts[11] === 'Yes',
    serpFeatures: parseArray(parts[12] || ''),
    competitorHeadings: unescapeFromTable(parts[13] || ''),
    competitorMeta: unescapeFromTable(parts[14] || ''),
    avgWordCount: isNewFormat ? parseInt(parts[15], 10) || 0 : 0,
    opportunityScore: parseInt(isNewFormat ? parts[16] : parts[15], 10) || 0,
    recommendedFormat: unescapeFromTable(isNewFormat ? parts[17] : parts[16] || ''),
    clusterType: unescapeFromTable(isNewFormat ? parts[18] : parts[17] || ''),
    suggestedAnchorText: unescapeFromTable(isNewFormat ? parts[19] : parts[18] || ''),
    funnelStage: unescapeFromTable(isNewFormat ? parts[20] : ''),
    informationGain: unescapeFromTable(isNewFormat ? parts[21] : ''),
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
    data.avgWordCount.toString(),
    data.opportunityScore.toString(),
    sanitizeForTable(data.recommendedFormat),
    sanitizeForTable(data.clusterType),
    sanitizeForTable(data.suggestedAnchorText),
    sanitizeForTable(data.funnelStage),
    sanitizeForTable(data.informationGain),
  ]

  return `| ${columns.join(' | ')} |`
}

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
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
        // Wait and retry
        await new Promise(r => setTimeout(r, 1000 * (i + 1)))
      }
    } catch (_e) {
      if (i === retries - 1) throw _e
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries`)
}

async function crawlSingleUrl(url: string, index: number): Promise<CrawlResult> {
  try {
    const response = await fetchWithRetry(url)
    const html = await response.text()
    const dom = new JSDOM(html)
    const doc = dom.window.document

    // SGE Citability Logic
    let sgeCitabilityScore = 0
    const listCount = doc.querySelectorAll('ul, ol').length
    const tableCount = doc.querySelectorAll('table').length
    const boldCount = doc.querySelectorAll('strong, b').length
    
    if (listCount > 3) sgeCitabilityScore += 30
    if (tableCount > 0) sgeCitabilityScore += 20
    if (boldCount > 10) sgeCitabilityScore += 10
    if (html.length > 5000) sgeCitabilityScore += 10

    doc.querySelectorAll('script, style, nav, footer, header, noscript, iframe, link, svg').forEach((el: Element) => el.remove())

    const headings = Array.from(doc.querySelectorAll('h2, h3'))
      .map((h) => {
        const element = h as Element
        element.querySelectorAll('style, script, .hidden, [style*="display: none"]').forEach(el => el.remove())
        return `${element.tagName.toUpperCase()}: ${element.textContent?.trim()}`
      })
      .filter((t) => t.length > 10 && !t.includes('{') && !t.includes('}') && !t.includes('color:'))

    const title = doc.querySelector('title')?.textContent?.trim() || 'No Title'
    const description =
      doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ||
      doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() ||
      'No Description'

    const metaSummary = `Title: ${title} | Desc: ${description.slice(0, 100)}${description.length > 100 ? '...' : ''}`
    const text = doc.body.textContent || ''
    const wordCount = text.trim().split(/\s+/).filter((word: string) => word.length > 0).length
    const discoveredKeywords = extractPhrases(text)

    const headingSummary = headings.length > 0 ? headings.slice(0, 10).join(' - ') : 'No headings found'

    process.stdout.write(`\r${colors.green}    ✅ Success (${index}): ${url.substring(0, 50)}...    \n${colors.reset}`)

    return {
      headings: headingSummary,
      meta: metaSummary,
      wordCount,
      discoveredKeywords,
      success: true,
      sgeCitabilityScore: Math.min(100, sgeCitabilityScore)
    }
  } catch (_e) {
    process.stdout.write(`\r${colors.red}    ❌ Failed (${index}): ${url.substring(0, 50)}... (${_e instanceof Error ? _e.message : 'Error'})    \n${colors.reset}`)
    return { headings: '', meta: '', wordCount: 0, discoveredKeywords: [], success: false, sgeCitabilityScore: 0 }
  }
}

async function crawlCompetitorContent(
  urls: string[],
): Promise<{ headings: string; meta: string; avgWordCount: number; discoveredKeywords: string[]; sgeCitabilityScore: number }> {
  const limit = pLimit(MAX_CONCURRENT_CRAWLS)
  const tasks = urls.slice(0, 8).map((url, i) => limit(() => crawlSingleUrl(url, i + 1)))
  const results = await Promise.all(tasks)
  
  const successful = results.filter(r => r.success).slice(0, MAX_SUCCESSFUL_CRAWLS_PER_KEYWORD)

  if (successful.length === 0) {
    return { headings: 'Crawl Failed (No data found)', meta: 'Crawl Failed', avgWordCount: 0, discoveredKeywords: [], sgeCitabilityScore: 0 }
  }

  const totalWords = successful.reduce((acc, r) => acc + r.wordCount, 0)
  const avgWordCount = Math.round(totalWords / successful.length)
  const allDiscovered = Array.from(new Set(successful.flatMap(r => r.discoveredKeywords)))
  const avgSgeScore = Math.round(successful.reduce((acc, r) => acc + r.sgeCitabilityScore, 0) / successful.length)

  return {
    headings: successful.map((r, i) => `[U${i + 1}] ${r.headings}`).join(' || '),
    meta: successful.map((r, i) => `[U${i + 1}] ${r.meta}`).join(' || '),
    avgWordCount,
    discoveredKeywords: allDiscovered,
    sgeCitabilityScore: avgSgeScore
  }
}

function calculateOpportunityScore(volume: number, difficulty: number, intent?: string): number {
  let baseScore = 0
  if (difficulty < 15) {
    baseScore = volume > 100 ? 98 : 80
  } else if (difficulty < 35) {
    baseScore = volume > 5000 ? 90 : 70
  } else {
    baseScore = Math.max(5, Math.min(60, volume / 10000))
  }

  // Intent Multiplier (2026 Strategy: Prioritize Decision Stage)
  if (intent === 'Transactional') return Math.min(100, baseScore * 1.2)
  if (intent === 'Commercial') return Math.min(100, baseScore * 1.1)
  
  return baseScore
}

export async function main() {
  const KEYWORDS_FILE_PATH = path.join(process.cwd(), 'content', 'keywords.md')
  
  process.stdout.write(`${colors.blue}⏳ Initializing...${colors.reset}`)
  await getPayload({ config })
  process.stdout.write(`\r${colors.green}✅ System Ready.    \n${colors.reset}`)

  if (!fs.existsSync(KEYWORDS_FILE_PATH)) {
    console.error(`${colors.red}❌ Keywords file not found: ${KEYWORDS_FILE_PATH}${colors.reset}`)
    return 1
  }

  const args = process.argv.slice(2)
  const sourceArg = args.find((arg) => arg.startsWith('--source='))
  const adapter = getSeoAdapter(sourceArg ? sourceArg.split('=')[1] : undefined)
  const analyzeGapFlag = args.includes('--analyze-gap')
  const selectAll = args.includes('--all')

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
    return 0
  }

  let selectedToUpdate: typeof allKeywords = []

  if (process.stdout.isTTY && !selectAll) {
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
      }) as MultiSelectPrompt

      const selectedNames = await prompt.run()
      selectedToUpdate = allKeywords.filter((k) => selectedNames.includes(k.data.keyword))
    } catch (_e) {
      console.log(`\n${colors.yellow}Operation cancelled.${colors.reset}`)
      return 0
    }
  } else {
    selectedToUpdate = allKeywords
  }

  if (selectedToUpdate.length === 0) {
    console.log(`${colors.yellow}No keywords selected. Exiting.${colors.reset}`)
    return 0
  }

  console.log(`\n${colors.blue}📦 Updating ${selectedToUpdate.length} keywords...${colors.reset}\n`)

  const today = new Date().toISOString().split('T')[0]
  const resultsMap = new Map<string, KeywordData>()
  const discoveredGaps = new Map<string, { keyword: string; score: number; foundIn: string[] }>()
  const existingKeywordsLower = new Set(allKeywords.map(k => k.data.keyword.toLowerCase()))

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

        // DERIVE SEO METADATA
        data.intent = deriveIntent(data.keyword, data.intent)
        data.funnelStage = deriveFunnelStage(data.intent as Intent)
        data.informationGain = deriveInformationGain(data.keyword)

        const strategy = deriveStrategy(data.volume, data.difficulty, data.intent as Intent)
        data.clusterType = strategy.clusterType
        data.recommendedFormat = strategy.recommendedFormat
        data.opportunityScore = calculateOpportunityScore(data.volume, data.difficulty, data.intent)

        const currentYear = new Date().getFullYear()
        data.suggestedAnchorText = `${currentYear} ${data.recommendedFormat} on ${data.keyword} | ${data.keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`

        // PROCESS NEW RELATED SEARCHES FOR GAPS
        if (metrics.relatedSearches?.length) {
          for (const rel of metrics.relatedSearches) {
            const kwLower = rel.toLowerCase().trim()
            if (existingKeywordsLower.has(kwLower) || kwLower.length < 4) continue
            const prev = discoveredGaps.get(kwLower) || { keyword: rel, score: 0, foundIn: [] }
            if (!prev.foundIn.includes(data.keyword)) {
              prev.score += 5 
              prev.foundIn.push(data.keyword)
            }
            discoveredGaps.set(kwLower, prev)
          }
        }

        if (metrics.topUrls?.length) {
          console.log(`    Analyzing top ${metrics.topUrls.length} competitors for metrics and gaps...`)
          const crawlerResults = await crawlCompetitorContent(metrics.topUrls)

          let headings = crawlerResults.headings
          if (data.paaQuestions?.length) {
            const paaHeading = `[PAA] ${data.paaQuestions.slice(0, 5).join(' - ')}`
            headings = `${paaHeading} || ${headings}`
          }
          if (!crawlerResults.headings.includes('Crawl Failed')) data.competitorHeadings = headings
          if (!crawlerResults.meta.includes('Crawl Failed')) data.competitorMeta = crawlerResults.meta
          data.avgWordCount = crawlerResults.avgWordCount

          // Calculate Information Gain Strategy
          const generalGain = deriveInformationGain(data.keyword)
          if (crawlerResults.sgeCitabilityScore < 50) {
            data.informationGain = `${generalGain} • Los competidores tienen baja citabilidad SGE (${crawlerResults.sgeCitabilityScore}%). Priorizaré formatos de lista y definiciones directas para robar el AI Overview.`
          } else {
            data.informationGain = `${generalGain} • Competidores fuertes en SGE (${crawlerResults.sgeCitabilityScore}%). Necesito aportar datos propios o un script técnico único para diferenciarme.`
          }

          for (const gapKw of crawlerResults.discoveredKeywords) {
            const kwLower = gapKw.toLowerCase()
            if (existingKeywordsLower.has(kwLower)) continue
            
            const prev = discoveredGaps.get(kwLower) || { keyword: gapKw, score: 0, foundIn: [] }
            if (!prev.foundIn.includes(data.keyword)) {
              prev.score += 1
              prev.foundIn.push(data.keyword)
            }
            discoveredGaps.set(kwLower, prev)
          }
        }

        console.log(
          `    ${colors.green}✅ Success: Vol ${data.volume}, Diff ${data.difficulty}, Avg. Words ${data.avgWordCount}${colors.reset}\n`,
        )
      }
    } catch (_e) {
      console.error(
        `    ${colors.red}❌ Error: ${_e instanceof Error ? _e.message : String(_e)}${colors.reset}\n`,
      )
    }
    resultsMap.set(data.keyword, data)
  }

  // Handle Discovered Gaps
  if (analyzeGapFlag && discoveredGaps.size > 0) {
    const finalGaps = Array.from(discoveredGaps.values())
      .filter(g => g.score >= 2) 
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)

    if (finalGaps.length > 0) {
      console.log(`\n${colors.cyan}${colors.bright}💎 Discovered Keyword Gaps:${colors.reset}`)
      finalGaps.forEach((g, i) => {
        console.log(`${i+1}. ${colors.green}${g.keyword}${colors.reset} (Score: ${g.score}) - Relevant for: ${g.foundIn.slice(0, 2).join(', ')}`)
        
        const gapData: KeywordData = {
          keyword: g.keyword,
          targetUrl: `/gap/${g.keyword.toLowerCase().replace(/\s+/g, '-')}`,
          volume: 0,
          difficulty: 0,
          intent: 'Informational',
          status: 'Gap',
          lastUpdated: '',
          source: 'GapAnalyzer',
          relatedSearches: [],
          paaCount: 0,
          topDomain: '',
          hasAiOverview: false,
          serpFeatures: [],
          competitorHeadings: '',
          competitorMeta: '',
          avgWordCount: 0,
          opportunityScore: 0,
          recommendedFormat: 'Blog',
          clusterType: 'Supporting',
          suggestedAnchorText: '',
          funnelStage: 'Awareness (TOFU)',
          informationGain: ''
        }
        resultsMap.set(g.keyword, gapData)
      })
    }
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
        '| Keyword | Target URL | Volume | Difficulty | Intent | Status | Last Updated | Source | Related Searches | PAA Count | Top Domain | Has AI Overview | SERP Features | Competitor Headings | Competitor Meta | Avg. Word Count | Opportunity Score | Recommended Format | Cluster Type | Suggested Anchor Text | Funnel Stage | Information Gain |',
      )
      headerProcessed = true
      continue
    }
    if (headerProcessed && !separatorProcessed && line.includes('---')) {
      updatedLines.push(
        '| :-------------------------------- | :-------------------------------------------- | :----- | :--------- | :----- | :----- | :----------- | :----- | :--------------- | :-------- | :--------- | :-------------- | :------------ | :------------------ | :-------------- | :-------------- | :---------------- | :----------------- | :----------- | :-------------------- | :----------- | :-------------------- |',
      )
      separatorProcessed = true
      continue
    }

    if (headerProcessed && separatorProcessed && line.trim().startsWith('|')) {
      const parsed = parseLine(line)
      if (parsed && resultsMap.has(parsed.keyword)) {
        updatedLines.push(formatLine(resultsMap.get(parsed.keyword)!))
        resultsMap.delete(parsed.keyword)
      } else if (parsed) {
        updatedLines.push(formatLine(parsed))
        resultsMap.delete(parsed.keyword)
      } else {
        updatedLines.push(line)
      }
    } else {
      updatedLines.push(line)
    }
  }

  for (const remainingData of resultsMap.values()) {
    updatedLines.push(formatLine(remainingData))
  }

  fs.writeFileSync(KEYWORDS_FILE_PATH, updatedLines.join('\n'))
  console.log(
    `${colors.green}${colors.bright}✨ Finished! File updated at ${KEYWORDS_FILE_PATH}${colors.reset}\n`,
  )
  return 0
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then(code => process.exit(code || 0)).catch((err) => {
    console.error(`\n${colors.red}Fatal error:${colors.reset}`, err)
    process.exit(1)
  })
}
