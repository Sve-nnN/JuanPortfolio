import fs from 'fs'
import { KeywordData } from '../syncKeywords'

export const OFFICIAL_HEADERS = [
  'Keyword', 'Target URL', 'Language', 'Country', 'Volume', 'Difficulty',
  'Intent', 'Status', 'Last Updated', 'Source', 'Trend', 'PAA Count',
  'Related Searches', 'PAA Questions', 'Top Domain', 'Has AI Overview',
  'SERP Features', 'Competitor Headings', 'Competitor Meta', 'Avg. Word Count',
  'Cluster Type', 'Suggested Anchor Text',
]

const unescapeFromTable = (text: string): string => text ? text.replace(/\\\|/g, '|') : ''
const sanitizeForTable = (text: string | undefined | null): string =>
  text ? text.replace(/\|/g, '\\|').replace(/\n/g, ' ').trim() : ''

function parseVolume(raw: unknown): number {
  const val = parseInt(String(raw || '0').replace(/[^\d]/g, ''), 10) || 0
  return val > 1_000_000 ? 0 : val
}

export function kwDataValueFor(h: string, data: KeywordData): string {
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

export function formatLine(data: KeywordData, headers = OFFICIAL_HEADERS): string {
  return `| ${headers.map(h => kwDataValueFor(h, data)).join(' | ')} |`
}

export function parseKeywordsMarkdown(content: string): { keywords: KeywordData[], headers: string[] } {
  const lines = content.split(/\r?\n/)
  const dividerIndex = lines.findIndex(l => l.includes('---'))
  if (dividerIndex === -1) return { keywords: [], headers: OFFICIAL_HEADERS }

  const headerLine = lines[dividerIndex - 1]!
  const originalHeaders = headerLine.split(/(?<!\\)\|/).map(h => h.trim()).filter(Boolean)
  const lowerHeaders = originalHeaders.map(h => h.toLowerCase())

  const keywords: KeywordData[] = []
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
    
    keywords.push({
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
    })
  }
  return { keywords, headers: originalHeaders }
}

export function updateKeywordInTable(content: string, data: KeywordData): string {
  const lines = content.split(/\r?\n/)
  const dividerIndex = lines.findIndex(l => l.includes('---'))
  if (dividerIndex === -1) return content

  const headerLine = lines[dividerIndex - 1]!
  const headers = headerLine.split(/(?<!\\)\|/).map(h => h.trim()).filter(Boolean)

  let updated = false
  const updatedLines = lines.map(line => {
    if (!line.trim().startsWith('|') || line.includes('Keyword') || line.includes('---')) return line
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
    // Find the end of the table
    let lastTableLine = dividerIndex + 1
    for (let i = dividerIndex + 1; i < updatedLines.length; i++) {
      if (updatedLines[i]!.trim().startsWith('|')) {
        lastTableLine = i + 1
      } else if (updatedLines[i]!.trim() !== '') {
        break
      }
    }
    updatedLines.splice(lastTableLine, 0, formatLine(data, headers))
  }

  return updatedLines.join('\n')
}
