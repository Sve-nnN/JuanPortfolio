import fs from 'fs'
import path from 'path'
import * as p from '@clack/prompts'
import pLimit from 'p-limit'
import { getPayload } from 'payload'
import config from '../payload.config'
import { SerpApiAdapter } from './seo/adapters/SerpApiAdapter'
import { SerpCache } from './seo/SerpCache'
import { KeywordIntelligenceService } from './seo/WordCountCrawler'
import { loadState as loadDinoState } from './create-post'
import {
  scrapeWithRetry,
  loadCache as loadDinoCache,
  saveCache as saveDinoCache,
  isCacheValid as isDinoCacheValid,
  setDebug,
  type KWCacheEntry,
} from './scrape-dinorank'

const KEYWORDS_FILE = path.resolve(process.cwd(), 'content/keywords.md')
const BACKLOG_FILE = path.resolve(process.cwd(), 'content/keywords_backlog.md')
const intelService = new KeywordIntelligenceService()
const limit = pLimit(1) // Atomic sequential processing

const colors = { reset: '\x1b[0m', green: '\x1b[32m', blue: '\x1b[34m', red: '\x1b[31m', yellow: '\x1b[33m', cyan: '\x1b[36m', dim: '\x1b[2m' }

// ─── Exports ────────────────────────────────────────────────────────────────

export const COUNTRIES_BY_LANG: Record<string, string[]> = {
  es: ['es', 'mx', 'ar'],
  en: ['us', 'gb', 'au'],
}

export interface KeywordData {
  keyword: string
  targetURL: string
  language?: string
  country?: string
  volume: number
  difficulty: number
  intent: string
  status: string
  source?: string
  lastUpdated?: string
  relatedSearches?: string[]
  paaQuestions?: string[]
  paaCount?: number
  topDomain?: string
  hasAiOverview?: boolean
  serpFeatures?: string[]
  competitorHeadings?: string
  competitorMeta?: string
  avgWordCount?: number
  clusterType?: string
  suggestedAnchorText?: string
  trend?: string
  post?: string
  page?: string
}

export const OFFICIAL_HEADERS = [
  'Keyword', 'Target URL', 'Language', 'Country', 'Volume', 'Difficulty',
  'Intent', 'Status', 'Last Updated', 'Source', 'Trend', 'PAA Count',
  'Related Searches', 'PAA Questions', 'Top Domain', 'Has AI Overview',
  'SERP Features', 'Competitor Headings', 'Competitor Meta', 'Avg. Word Count',
  'Cluster Type', 'Suggested Anchor Text',
]

/** Last headers parsed by parseKeywordsMarkdown — used by formatLine for round-trips. */
let _lastHeaders: string[] = [...OFFICIAL_HEADERS]

// ─── Language & Intent Detection ─────────────────────────────────────────────

/** Detects keyword language by heuristics (diacritics → Spanish function words → English default). */
export function detectLang(keyword: string): string {
  if (/[áéíóúñüÁÉÍÓÚÑÜ]/.test(keyword)) return 'es'
  const words = keyword.toLowerCase().split(/\s+/)
  const esFunctionWords = new Set([
    'que', 'es', 'el', 'la', 'los', 'las', 'de', 'en', 'por', 'un', 'una',
    'con', 'del', 'al', 'como', 'para', 'se', 'su', 'sus', 'mi', 'tu', 'nos',
    'les', 'y', 'o', 'si', 'no', 'hay', 'mas', 'muy', 'esto', 'esta', 'ese',
  ])
  const esContentWords = new Set([
    'seo', 'tecnico', 'tecnica', 'hacer', 'pagina', 'web', 'guia', 'herramientas',
    'mejores', 'mejor', 'marketing', 'digital', 'gratis', 'curso', 'precio',
    'arboles', 'binarios', 'estructuras', 'datos', 'algoritmos', 'programacion',
  ])
  let esScore = 0
  for (const w of words) {
    if (esFunctionWords.has(w)) esScore += 2
    else if (esContentWords.has(w)) esScore += 1
  }
  return esScore > 0 ? 'es' : 'en'
}

/** Classifies search intent from keyword + optional competitor titles. */
export function detectIntent(keyword: string, competitorTitles: string[] = []): string {
  const kw = keyword.toLowerCase()
  const scores: Record<string, number> = { Informational: 0, Navigational: 0, Commercial: 0, Transactional: 0 }

  const transWords = ['comprar', 'precio', 'descuento', 'oferta', 'gratis', 'descargar', 'download', 'buy', 'price', 'deal', 'discount']
  const commWords = ['mejores', 'mejor', 'vs', 'comparar', 'comparativa', 'review', 'alternativa', 'alternativas', 'top', 'ranking', 'best']
  const infoWords = ['como', 'que', 'que es', 'guia', 'guía', 'tutorial', 'aprende', 'learn', 'how', 'what', 'why', 'cuando', 'donde', 'manual', 'definicion', 'significado']
  const navWords = ['login', 'signup', 'register', 'acceder', 'entrar', 'github', 'twitter', 'facebook', 'instagram', 'youtube', 'linkedin', 'gmail']

  for (const w of kw.split(/\s+/)) {
    if (transWords.includes(w)) scores.Transactional += 2
    if (commWords.includes(w)) scores.Commercial += 2
    if (infoWords.includes(w)) scores.Informational += 2
    if (navWords.includes(w)) scores.Navigational += 2
  }
  if (/ vs | vs$|^vs /.test(kw)) scores.Commercial += 2
  if (/precio de[l ]/.test(kw)) scores.Transactional += 2

  const titleText = competitorTitles.join(' ').toLowerCase()
  for (const w of ['guía', 'guia', 'tutorial', 'aprende', 'cómo', 'como', 'que es', 'principios', 'básico', 'basico']) {
    if (titleText.includes(w)) scores.Informational += 1
  }

  const max = Math.max(...Object.values(scores))
  if (max === 0) return 'Informational'
  return Object.entries(scores).find(([, v]) => v === max)![0]
}

// ─── Table Helpers ────────────────────────────────────────────────────────────

const unescapeFromTable = (text: string): string => text ? text.replace(/\\\|/g, '|') : ''
const sanitizeForTable = (text: string | undefined | null): string =>
  text ? text.replace(/\|/g, '\\|').replace(/\n/g, ' ').trim() : ''

function parseVolume(raw: unknown): number {
  const val = parseInt(String(raw || '0').replace(/[^\d]/g, ''), 10) || 0
  return val > 1_000_000 ? 0 : val
}

function kwDataValueFor(h: string, data: KeywordData): string {
  const formatArr = (arr: string[] | undefined) => (arr || []).join('; ')
  switch (h.toLowerCase()) {
    case 'keyword': return sanitizeForTable(data.keyword)
    case 'target url': return sanitizeForTable(data.targetURL)
    case 'language': return sanitizeForTable(data.language)
    case 'country': return sanitizeForTable(data.country)
    case 'volume': return (data.volume ?? 0).toString()
    case 'difficulty': return (data.difficulty ?? 0).toString()
    case 'intent': return sanitizeForTable(data.intent)
    case 'status': return sanitizeForTable(data.status)
    case 'source': return sanitizeForTable(data.source)
    case 'last updated': return sanitizeForTable(data.lastUpdated)
    case 'trend': return sanitizeForTable(data.trend)
    case 'paa count': return (data.paaCount ?? 0).toString()
    case 'related searches': return formatArr(data.relatedSearches)
    case 'paa questions': return formatArr(data.paaQuestions)
    case 'top domain': return sanitizeForTable(data.topDomain)
    case 'has ai overview': return data.hasAiOverview ? 'Yes' : 'No'
    case 'serp features': return formatArr(data.serpFeatures)
    case 'competitor headings': return sanitizeForTable(data.competitorHeadings)
    case 'competitor meta': return sanitizeForTable(data.competitorMeta)
    case 'avg. word count': return (data.avgWordCount ?? 0).toString()
    case 'cluster type': return sanitizeForTable(data.clusterType)
    case 'suggested anchor text': return sanitizeForTable(data.suggestedAnchorText)
    default: return ''
  }
}

export function formatLine(data: KeywordData, headers = _lastHeaders): string {
  return `| ${headers.map(h => kwDataValueFor(h, data)).join(' | ')} |`
}

function mergeKeywords(oldK: KeywordData, newK: KeywordData): KeywordData {
  return {
    ...oldK, ...newK,
    volume: newK.volume || oldK.volume,
    difficulty: newK.difficulty || oldK.difficulty,
    lastUpdated: newK.lastUpdated || oldK.lastUpdated || new Date().toISOString().split('T')[0],
    relatedSearches: [...new Set([...(oldK.relatedSearches || []), ...(newK.relatedSearches || [])])],
    paaQuestions: [...new Set([...(oldK.paaQuestions || []), ...(newK.paaQuestions || [])])],
    status: (newK.status && newK.status !== '-') ? newK.status : oldK.status,
  }
}

// ─── Atomic File Update ──────────────────────────────────────────────────────

function updateKeywordInFile(data: KeywordData): void {
  if (!fs.existsSync(KEYWORDS_FILE)) return
  const content = fs.readFileSync(KEYWORDS_FILE, 'utf-8')
  const lines = content.split(/\r?\n/)
  const dividerIndex = lines.findIndex(l => l.includes('---'))
  if (dividerIndex === -1) return

  const headerLine = lines[dividerIndex - 1]!
  const headers = headerLine.split(/(?<!\\)\|/).map(h => h.trim()).filter(Boolean)

  let updated = false
  const updatedLines = lines.map(line => {
    if (!line.trim().startsWith('|') || line.includes('Keyword')) return line
    const parts = line.split(/(?<!\\)\|/).map(p => p.trim())
    if (parts[0] === '') parts.shift()
    const kwValue = parts[0] || '' 
    if (kwValue.toLowerCase() === data.keyword.toLowerCase()) {
      updated = true
      return formatLine(data, headers)
    }
    return line
  })

  if (!updated) {
    updatedLines.push(formatLine(data, headers))
  }

  fs.writeFileSync(KEYWORDS_FILE, updatedLines.join('\n'), 'utf-8')
}

// ─── Parsing ──────────────────────────────────────────────────────────────────

export const parseKeywordsMarkdown = (content: string): KeywordData[] => {
  const lines = content.split(/\r?\n/)
  const dividerIndex = lines.findIndex(l => l.includes('---'))
  if (dividerIndex === -1) return []

  const headerLine = lines[dividerIndex - 1]!
  const originalHeaders = headerLine.split(/(?<!\\)\|/).map(h => h.trim()).filter(Boolean)
  const lowerHeaders = originalHeaders.map(h => h.toLowerCase())
  _lastHeaders = originalHeaders

  const kwMap = new Map<string, KeywordData>()
  for (const line of lines.slice(dividerIndex + 1)) {
    if (!line.trim() || !line.trim().startsWith('|')) continue
    const parts = line.split(/(?<!\\)\|/).map(p => p.trim())
    if (parts[0] === '') parts.shift()
    if (parts[parts.length - 1] === '') parts.pop()
    const getValue = (header: string): string => {
      const idx = lowerHeaders.indexOf(header.toLowerCase())
      return idx !== -1 && parts[idx] ? unescapeFromTable(parts[idx]) : ''
    }
    const kw = getValue('keyword')
    if (!kw || kw.toLowerCase() === 'keyword' || kw.startsWith('---')) continue
    const data: KeywordData = {
      keyword: kw,
      targetURL: getValue('target url'),
      language: getValue('language') || undefined,
      country: getValue('country') || undefined,
      volume: parseVolume(getValue('volume')),
      difficulty: parseInt(getValue('difficulty'), 10) || 0,
      intent: getValue('intent'),
      status: getValue('status') || '-',
      source: getValue('source') || undefined,
      lastUpdated: getValue('last updated') || undefined,
      trend: getValue('trend') || undefined,
      paaCount: parseInt(getValue('paa count'), 10) || 0,
      relatedSearches: getValue('related searches').split(';').map(x => x.trim()).filter(Boolean),
      paaQuestions: getValue('paa questions').split(';').map(x => x.trim()).filter(Boolean),
      topDomain: getValue('top domain') || undefined,
      hasAiOverview: getValue('has ai overview').toLowerCase() === 'yes',
      serpFeatures: getValue('serp features').split(';').map(x => x.trim()).filter(Boolean),
      competitorHeadings: getValue('competitor headings') || undefined,
      competitorMeta: getValue('competitor meta') || undefined,
      avgWordCount: parseInt(getValue('avg. word count'), 10) || 0,
      clusterType: getValue('cluster type') || undefined,
      suggestedAnchorText: getValue('suggested anchor text') || undefined,
    }
    const lowKw = kw.toLowerCase()
    if (kwMap.has(lowKw)) kwMap.set(lowKw, mergeKeywords(kwMap.get(lowKw)!, data))
    else kwMap.set(lowKw, data)
  }
  return Array.from(kwMap.values())
}

// ─── DinoRank Enrichment ──────────────────────────────────────────────────────

function applyDinoResult(kwData: KeywordData, res: KWCacheEntry, country: string): void {
  kwData.volume = parseVolume(res.volume)
  kwData.difficulty = Math.round(parseFloat(String(res.competency).replace(',', '.')) * 100) || parseInt(String(res.competency), 10) || 0
  kwData.country = country
  const rawTs = res.timestamp ? res.timestamp.split('T')[0] : ''
  const isValidDate = rawTs && /^\d{4}-\d{2}-\d{2}$/.test(rawTs)
  kwData.lastUpdated = isValidDate ? rawTs : new Date().toISOString().split('T')[0]
  
  if (Array.isArray(res.trend) && res.trend.length > 0) kwData.trend = res.trend.join(',')
  if (res.relatedSearches) {
    kwData.relatedSearches = res.relatedSearches.split(/,\s*/).map(s => s.trim()).filter(Boolean)
  }
}

export async function enrichWithDinoRank(
  keywords: KeywordData[],
  useAI = false,
  isDebug = false,
  force = false,
  mode: 'research' | 'suggestions' = 'research',
  discover = false,
  maxAccounts = 2
): Promise<{ enriched: number; failed: number; suggestions: KeywordData[] }> {
  const dinoCache = loadDinoCache()
  const dinoState = loadDinoState()
  let enriched = 0, failed = 0
  const suggestions: KeywordData[] = []

  // Mandarin language detection
  keywords.forEach(k => {
    const detected = detectLang(k.keyword)
    if (!k.language || k.language === '-') k.language = detected
  })

  const resultsByKwAndCountry = new Map<string, Map<string, KWCacheEntry>>()

  for (const kw of keywords) {
    const lang = kw.language!
    let countries: string[] = []
    
    if (kw.country && kw.country !== '-') {
      countries = [kw.country]
    } else if (discover) {
      countries = COUNTRIES_BY_LANG[lang] || COUNTRIES_BY_LANG.en
    } else {
      countries = [(COUNTRIES_BY_LANG[lang] || COUNTRIES_BY_LANG.en)[0]!]
    }

    for (const country of countries) {
      const cacheKey = `${kw.keyword.toLowerCase()}_${country}`
      const cached = dinoCache[cacheKey]
      
      if (cached && isDinoCacheValid(cached.timestamp) && !force) {
        if (!resultsByKwAndCountry.has(kw.keyword.toLowerCase())) resultsByKwAndCountry.set(kw.keyword.toLowerCase(), new Map())
        resultsByKwAndCountry.get(kw.keyword.toLowerCase())!.set(country, cached)
      } else {
        try {
          const scraped = await scrapeWithRetry([kw.keyword], country, dinoState, useAI, lang, mode, maxAccounts)
          for (const res of scraped) {
            const kwLower = res.keyword.toLowerCase()
            dinoCache[`${kwLower}_${country}`] = res
            if (!resultsByKwAndCountry.has(kwLower)) resultsByKwAndCountry.set(kwLower, new Map())
            resultsByKwAndCountry.get(kwLower)!.set(country, res)
          }
        } catch (e) {
          if (isDebug) console.error(`[DinoRank] Error country=${country}:`, (e as Error).message)
          failed++
        }
      }
    }

    const options = resultsByKwAndCountry.get(kw.keyword.toLowerCase())
    if (options && options.size > 0) {
      const bestEntry = Array.from(options.entries()).reduce((prev, curr) => {
        const getMetrics = (entry: KWCacheEntry) => {
          const vol = parseVolume(entry.volume)
          const diff = Math.round(parseFloat(String(entry.competency).replace(',', '.')) * 100) || 0
          return vol * (101 - diff)
        }
        return getMetrics(curr[1]) > getMetrics(prev[1]) ? curr : prev
      })
      applyDinoResult(kw, bestEntry[1], bestEntry[0])
      kw.source = 'DinoRank'
      enriched++
    }
  }

  saveDinoCache(dinoCache)
  return { enriched, failed, suggestions }
}

// ─── SerpAPI Enrichment ───────────────────────────────────────────────────────

const serpCache = new SerpCache()

export async function enrichWithSerpData(
  keywords: KeywordData[],
  adapter: InstanceType<typeof SerpApiAdapter>,
  delay: number,
  isDebug = false,
): Promise<{ enriched: number; results: KeywordData[] }> {
  let enrichedCount = 0
  const enrichedKws: KeywordData[] = []
  
  for (const kw of keywords) {
    try {
      const locale = kw.language || 'es'
      let res = serpCache.get(kw.keyword, locale) as any
      if (!res) {
        res = await adapter.fetchMetrics(kw.keyword, locale)
        if (res) serpCache.set(kw.keyword, locale, res)
      }

      if (res) {
        if (res.difficulty) kw.difficulty = res.difficulty
        if (res.paaQuestions) kw.paaQuestions = res.paaQuestions
        if (res.paaCount !== undefined) kw.paaCount = res.paaCount
        kw.hasAiOverview = !!res.hasAiOverview
        if (res.topUrls?.length) {
          kw.topDomain = res.topUrls.join('; ')
          const intel = await intelService.getCompetitorMetrics(res.topUrls, 5)
          kw.avgWordCount = intel.avgWordCount
          kw.competitorHeadings = intel.combinedHeadings
          kw.competitorMeta = intel.combinedMetas
        }
        const titles = (res.competitorData || []).map((d: { title: string }) => d.title)
        kw.intent = kw.intent && kw.intent !== '-' ? kw.intent : detectIntent(kw.keyword, titles)
        kw.lastUpdated = new Date().toISOString().split('T')[0]
        kw.source = 'SerpApi'
        enrichedCount++
        enrichedKws.push(kw)
      }
    } catch { /* ignore */ }
  }
  return { enriched: enrichedCount, results: enrichedKws }
}

export async function enrichWithFaqs(
  keywords: KeywordData[],
  adapter: Pick<InstanceType<typeof SerpApiAdapter>, 'fetchMetrics'>,
  delay: number,
): Promise<{ enriched: number }> {
  let enrichedCount = 0
  for (const kw of keywords) {
    try {
      const res = await adapter.fetchMetrics(kw.keyword, kw.language || 'es')
      if (res?.paaQuestions) {
        kw.paaQuestions = res.paaQuestions
        kw.paaCount = res.paaQuestions.length
        enrichedCount++
      }
    } catch { /* ignore */ }
  }
  return { enriched: enrichedCount }
}

// ─── Backlog ──────────────────────────────────────────────────────────────────

function updateBacklog(suggestions: KeywordData[]): void {
  if (suggestions.length === 0) return
  const backlogContent = fs.existsSync(BACKLOG_FILE)
    ? fs.readFileSync(BACKLOG_FILE, 'utf-8')
    : `# Keywords Backlog\n\n| ${OFFICIAL_HEADERS.join(' | ')} |\n| ${OFFICIAL_HEADERS.map(() => ':---').join(' | ')} |\n`
  const mainKws = new Set(
    parseKeywordsMarkdown(fs.readFileSync(KEYWORDS_FILE, 'utf-8')).map(k => k.keyword.toLowerCase())
  )
  const backlogKws = new Map(parseKeywordsMarkdown(backlogContent).map(k => [k.keyword.toLowerCase(), k]))
  for (const s of suggestions) {
    const lowKw = s.keyword.toLowerCase()
    if (mainKws.has(lowKw)) continue
    if (backlogKws.has(lowKw)) backlogKws.set(lowKw, mergeKeywords(backlogKws.get(lowKw)!, s))
    else backlogKws.set(lowKw, s)
  }
  const lines = [`# Keywords Backlog`, ``, `| ${OFFICIAL_HEADERS.join(' | ')} |`, `| ${OFFICIAL_HEADERS.map(() => ':---').join(' | ')} |`]
  Array.from(backlogKws.values()).sort((a, b) => (b.volume || 0) - (a.volume || 0)).forEach(k => lines.push(formatLine(k, OFFICIAL_HEADERS)))
  fs.writeFileSync(BACKLOG_FILE, lines.join('\n'))
}

// ─── Main ─────────────────────────────────────────────────────────────────────

import { exportToCsv } from './export-keywords-csv'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)

const syncKeywords = async () => {
  const args = process.argv.slice(2)
  const kwArg = args.find(a => a.startsWith('--keywords='))?.slice('--keywords='.length)
  const flags = {
    debug: args.includes('--debug'),
    auto: args.includes('--auto') || args.includes('--all') || !!kwArg,
    old: args.includes('--old'),
    force: args.includes('--force'),
    noSerp: args.includes('--no-serp'),
    noDinorank: args.includes('--no-dinorank'),
    faqs: args.includes('--faqs'),
    ai: args.includes('--ai'),
    verbose: args.includes('--verbose'),
    suggestions: args.includes('--suggestions'),
    discover: args.includes('--discover'),
    maxAccounts: parseInt(args.find(a => a.startsWith('--max-accounts='))?.slice('--max-accounts='.length) || '2', 10),
    specificKws: kwArg ? kwArg.split(',').map(s => s.trim().toLowerCase()) : null,
  }

  if (flags.debug) setDebug(true)
  p.intro(`${colors.cyan}🚀 Keyword Sync Manager 2026 (Atomic Mode)${colors.reset}`)
  const payload = await getPayload({ config })
  const content = fs.readFileSync(KEYWORDS_FILE, 'utf-8')
  const allKeywords = parseKeywordsMarkdown(content)

  let keywordsToEnrich = allKeywords
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  if (flags.specificKws) keywordsToEnrich = allKeywords.filter(k => flags.specificKws!.includes(k.keyword.toLowerCase()))
  else if (flags.old) keywordsToEnrich = allKeywords.filter(k => !k.lastUpdated || new Date(k.lastUpdated) < sevenDaysAgo)

  p.log.info(`Archivo: ${allKeywords.length} kws. Enriqueciendo: ${keywordsToEnrich.length} kws.`)

  if (keywordsToEnrich.length > 0) {
    const doSerp = !flags.noSerp && (flags.auto || await p.confirm({ message: '¿SerpApi?', initialValue: true }))
    const doDino = !flags.noDinorank && (flags.auto || await p.confirm({ message: '¿DinoRank?', initialValue: true }))

    for (const kw of keywordsToEnrich) {
      p.log.step(`Actualizando: ${colors.cyan}${kw.keyword}${colors.reset}`)
      const batch = [kw]
      
      if (doSerp && process.env.SERPAPI_API_KEY) {
        await enrichWithSerpData(batch, new SerpApiAdapter(), 0, flags.debug)
      }
      
      if (doDino) {
        const { suggestions } = await enrichWithDinoRank(
          batch, 
          flags.ai, 
          flags.debug, 
          flags.force,
          flags.suggestions ? 'suggestions' : 'research',
          flags.discover,
          flags.maxAccounts
        )
        if (suggestions.length > 0) updateBacklog(suggestions)
      }

      updateKeywordInFile(kw)
    }
  }

  p.log.step('Sincronizando con Payload CMS...')
  for (const kwData of allKeywords) {
    try {
      const existing = await payload.find({ collection: 'keyword-metrics', where: { keyword: { equals: kwData.keyword } }, limit: 1 })
      const payloadData: any = { ...kwData, hasAiOverview: !!kwData.hasAiOverview }
      if (existing.docs.length > 0) await payload.update({ collection: 'keyword-metrics', id: existing.docs[0].id, data: payloadData })
      else await payload.create({ collection: 'keyword-metrics', data: payloadData })
    } catch {}
  }

  exportToCsv()
  p.log.success('Todo actualizado y guardado.')
  process.exit(0)
}

const isMain = process.argv[1] && (path.resolve(process.argv[1]) === path.resolve(__filename) || path.resolve(process.argv[1]).endsWith('syncKeywords.ts'))
if (isMain) syncKeywords()
