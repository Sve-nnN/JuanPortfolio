import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import type { Payload } from 'payload'
import config from '../payload.config'
import { SerpApiAdapter } from './seo/adapters/SerpApiAdapter'
import { SerpCache } from './seo/SerpCache'
import { KeywordIntelligenceService } from './seo/WordCountCrawler'

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
  volume: number
  difficulty: number
  intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational'
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
  clusterType?: 'Pillar' | 'Supporting'
  suggestedAnchorText?: string
  funnelStage?: 'Awareness (TOFU)' | 'Consideration (MOFU)' | 'Decision (BOFU)'
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

const getDocumentFromURL = async (payload: Payload, url: string): Promise<{ id: string, collection: 'posts' | 'pages', status: string, fullUrl: string } | null> => {
  if (!url || url === 'N/A' || url === '') return null

  const parts = url.split('/')
  const slug = parts[parts.length - 1]

  if (!slug) return null

  // Try posts first
  const posts = await payload.find({
    collection: 'posts',
    where: {
      slug: { equals: slug }
    },
    limit: 1,
  })

  if (posts.docs.length > 0) {
    const doc: any = posts.docs[0]
    const localePrefix = doc.idioma === 'en' ? '/en' : ''
    return { 
      id: String(doc.id), 
      collection: 'posts', 
      status: String(doc._status),
      fullUrl: `${localePrefix}/blog/${doc.slug}`
    }
  }

  // Then try pages
  const pages = await payload.find({
    collection: 'pages',
    where: {
      slug: { equals: slug }
    },
    limit: 1,
  })

  if (pages.docs.length > 0) {
    const doc: any = pages.docs[0]
    return { 
      id: String(doc.id), 
      collection: 'pages', 
      status: String(doc._status),
      fullUrl: `/${doc.slug}`
    }
  }

  return null
}

function formatLine(data: KeywordData): string {
  const formatArray = (arr: string[] | undefined): string => (arr || []).join('; ')
  const formatBoolean = (val: boolean | undefined): string => (val ? 'Yes' : 'No')

  const cols = new Array(23).fill('')
  cols[0] = sanitizeForTable(data.keyword)
  cols[1] = sanitizeForTable(data.targetURL)
  cols[2] = (data.volume ?? 0).toString()
  cols[3] = (data.difficulty ?? 0).toString()
  cols[4] = sanitizeForTable(data.intent)
  cols[5] = sanitizeForTable(data.status)
  cols[6] = sanitizeForTable(data.lastUpdated)
  cols[7] = sanitizeForTable(data.source)
  cols[8] = formatArray(data.relatedSearches)
  cols[9] = (data.paaCount ?? 0).toString()
  cols[10] = formatArray(data.paaQuestions)
  cols[11] = sanitizeForTable(data.topDomain)
  cols[12] = formatBoolean(data.hasAiOverview)
  cols[13] = formatArray(data.serpFeatures)
  cols[14] = sanitizeForTable(data.competitorHeadings)
  cols[15] = sanitizeForTable(data.competitorMeta)
  cols[16] = (data.avgWordCount ?? 0).toString()
  cols[17] = (data.opportunityScore ?? 0).toString()
  cols[18] = sanitizeForTable(data.recommendedFormat)
  cols[19] = sanitizeForTable(data.clusterType)
  cols[20] = sanitizeForTable(data.suggestedAnchorText)
  cols[21] = sanitizeForTable(data.funnelStage)
  cols[22] = sanitizeForTable(data.informationGain)

  return `| ${cols.join(' | ')} |`
}

export const parseKeywordsMarkdown = (content: string): KeywordData[] => {
  const lines = content.split(/\r?\n/)
  const keywords: KeywordData[] = []

  const dividerIndex = lines.findIndex(l => l.includes('---'))
  if (dividerIndex === -1) return []

  const dataLines = lines.slice(dividerIndex + 1)

  for (const line of dataLines) {
    if (!line.trim() || !line.startsWith('|')) continue

    const parts = line.split(/(?<!\\)\|/).map(p => p.trim())
    if (parts.length > 0 && parts[0] === '') parts.shift()
    if (parts.length > 0 && parts[parts.length - 1] === '') parts.pop()

    if (parts.length < 7) continue

    const keyword = unescapeFromTable(parts[0])
    if (!keyword || keyword === 'Keyword') continue

    const is23Col = parts.length >= 23
    const is22Col = parts.length === 22

    const parseArr = (s: string) => s.split(';').map(x => x.trim()).filter(Boolean)

    if (is23Col) {
      keywords.push({
        keyword,
        targetURL: unescapeFromTable(parts[1]),
        volume: parseInt(parts[2], 10) || 0,
        difficulty: parseInt(parts[3], 10) || 0,
        intent: unescapeFromTable(parts[4]) as any,
        status: unescapeFromTable(parts[5]),
        lastUpdated: unescapeFromTable(parts[6]),
        source: unescapeFromTable(parts[7]) || 'Manual',
        relatedSearches: parseArr(parts[8]),
        paaCount: parseInt(parts[9], 10) || 0,
        paaQuestions: unescapeFromTable(parts[10]).split(';').map(s => s.trim()).filter(Boolean),
        topDomain: unescapeFromTable(parts[11]),
        hasAiOverview: parts[12] === 'Yes',
        serpFeatures: parseArr(parts[13]),
        competitorHeadings: unescapeFromTable(parts[14]),
        competitorMeta: unescapeFromTable(parts[15]),
        avgWordCount: parseInt(parts[16], 10) || 0,
        opportunityScore: parseInt(parts[17], 10) || 0,
        recommendedFormat: unescapeFromTable(parts[18]),
        clusterType: unescapeFromTable(parts[19]) as any,
        suggestedAnchorText: unescapeFromTable(parts[20]),
        funnelStage: (['Awareness (TOFU)', 'Consideration (MOFU)', 'Decision (BOFU)'].includes(unescapeFromTable(parts[21]))
          ? unescapeFromTable(parts[21])
          : undefined) as any,
        informationGain: unescapeFromTable(parts[22]),
      })
    } else if (is22Col) {
      keywords.push({
        keyword,
        targetURL: unescapeFromTable(parts[1]),
        volume: parseInt(parts[2], 10) || 0,
        difficulty: parseInt(parts[3], 10) || 0,
        intent: unescapeFromTable(parts[4]) as any,
        status: unescapeFromTable(parts[5]),
        lastUpdated: unescapeFromTable(parts[6]),
        source: unescapeFromTable(parts[7]) || 'Manual',
        relatedSearches: parseArr(parts[8]),
        paaCount: parseInt(parts[9], 10) || 0,
        topDomain: unescapeFromTable(parts[10]),
        hasAiOverview: parts[11] === 'Yes',
        serpFeatures: parseArr(parts[12]),
        competitorHeadings: unescapeFromTable(parts[13]),
        competitorMeta: unescapeFromTable(parts[14]),
        avgWordCount: parseInt(parts[15], 10) || 0,
        opportunityScore: parseInt(parts[16], 10) || 0,
        recommendedFormat: unescapeFromTable(parts[17]),
        clusterType: unescapeFromTable(parts[18]) as any,
        suggestedAnchorText: unescapeFromTable(parts[19]),
        funnelStage: (['Awareness (TOFU)', 'Consideration (MOFU)', 'Decision (BOFU)'].includes(unescapeFromTable(parts[20]))
          ? unescapeFromTable(parts[20])
          : undefined) as any,
        informationGain: unescapeFromTable(parts[21]),
      })
    } else {
      keywords.push({
        keyword,
        targetURL: unescapeFromTable(parts[1]),
        volume: parseInt(parts[2], 10) || 0,
        difficulty: parseInt(parts[3], 10) || 0,
        intent: 'Informational',
        source: 'Manual'
      })
    }
  }

  return keywords
}

const detectKeywordLocale = (keyword: string): string => {
  if (/[áéíóúüñ¿¡]/i.test(keyword)) return 'es'
  if (/\b(de|en|el|la|los|las|para|como|que|es|del|con|por|una|sus|qué|cómo)\b/i.test(keyword)) return 'es'
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
      let metrics = cache.get(kwData.keyword, locale)
      
      if (!metrics) {
        if (verbose) process.stdout.write(`${colors.yellow}API${colors.reset}... `)
        metrics = await adapter.fetchMetrics(kwData.keyword, locale)
        if (metrics) {
          cache.set(kwData.keyword, locale, metrics)
          if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs))
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
          const newMeta = metrics.competitorData.slice(0, 3).map((c: { title: string; snippet: string }) => `[${c.title}] ${c.snippet}`).join(' || ')
          if (newMeta && newMeta.length > 10) kwData.competitorMeta = newMeta
        }

        enriched++
        if (verbose) console.log(`${colors.green}Done${colors.reset}`)
      } else {
        if (verbose) console.log(`${colors.red}No Data${colors.reset}`)
        failed++
      }
    } catch (e) {
      if (verbose) console.log(`${colors.red}Error${colors.reset}`)
      console.error(`❌ SerpAPI/Intel error for "${kwData.keyword}":`, e)
      failed++
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
  adapter: { fetchMetrics: (keyword: string, locale?: string) => Promise<{ paaQuestions?: string[]; paaCount?: number } | null> },
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
    } catch {
      failed++
    }
  }

  return { enriched, failed }
}

const syncKeywords = async () => {
  const args = process.argv.slice(2)
  const fetchSerp = args.includes('--fetch-serp')
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
          data: kwData as any,
        })
      } else {
        await payload.create({
          collection: 'keyword-metrics',
          data: kwData as any,
        })
      }
      updatedCount++
    } catch (e) {
      console.error(`❌ Error syncing "${kwData.keyword}":`, e)
    }
  }

  console.log(`\n${colors.blue}💾 Updating local ${KEYWORDS_FILE}...${colors.reset}`)
  const lines = content.split(/\r?\n/)
  const updatedLines: string[] = []
  let headerProcessed = false
  let separatorProcessed = false
  const resultsMap = new Map(keywords.map(k => [k.keyword.toLowerCase(), k]))

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
      const parts = line.split(/(?<!\\)\|/).map(p => p.trim())
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
  console.log(`${colors.green}✅ Sync and Update complete! (${updatedCount} keywords)${colors.reset}`)
  
  process.exit(0)
}

syncKeywords()
