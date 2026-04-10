import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseKeywordsMarkdown, KeywordData, OFFICIAL_HEADERS } from './syncKeywords'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '../..')

const KEYWORDS_FILE = path.join(ROOT, 'content/keywords.md')
const CSV_FILE = path.join(ROOT, 'content/keywords.csv')

/**
 * Returns the raw value for a given header from KeywordData, formatted for CSV.
 */
function getRawValue(h: string, data: KeywordData): string {
  const formatArr = (arr: string[] | undefined) => (arr || []).join('; ')
  switch (h.toLowerCase()) {
    case 'keyword': return data.keyword
    case 'target url': return data.targetURL
    case 'language': return data.language || ''
    case 'country': return data.country || ''
    case 'volume': return (data.volume ?? 0).toString()
    case 'difficulty': return (data.difficulty ?? 0).toString()
    case 'intent': return data.intent || ''
    case 'status': return data.status || ''
    case 'last updated': return data.lastUpdated || ''
    case 'related searches': return formatArr(data.relatedSearches)
    case 'paa questions': return formatArr(data.paaQuestions)
    case 'top domain': return data.topDomain || ''
    case 'has ai overview': return data.hasAiOverview ? 'Yes' : 'No'
    case 'serp features': return formatArr(data.serpFeatures)
    case 'competitor headings': return data.competitorHeadings || ''
    case 'competitor meta': return data.competitorMeta || ''
    case 'avg. word count': return (data.avgWordCount ?? 0).toString()
    case 'cluster type': return data.clusterType || ''
    case 'suggested anchor text': return data.suggestedAnchorText || ''
    default: return ''
  }
}

/**
 * Escapes a string for use in a CSV file.
 */
function escapeCsv(text: string): string {
  if (!text) return ''
  const escaped = text.replace(/"/g, '""')
  return `"${escaped}"`
}

/**
 * Reads keywords.md and exports it to keywords.csv
 */
export function exportToCsv() {
  if (!fs.existsSync(KEYWORDS_FILE)) {
    console.error(`❌ Error: ${KEYWORDS_FILE} not found.`)
    return
  }

  try {
    const content = fs.readFileSync(KEYWORDS_FILE, 'utf-8')
    const keywords = parseKeywordsMarkdown(content)

    if (keywords.length === 0) {
      console.warn('⚠️ No keywords found in keywords.md')
      return
    }

    const csvRows = []
    
    // Add headers
    csvRows.push(OFFICIAL_HEADERS.map(h => escapeCsv(h)).join(','))
    
    // Add rows
    for (const kw of keywords) {
      const row = OFFICIAL_HEADERS.map(h => escapeCsv(getRawValue(h, kw)))
      csvRows.push(row.join(','))
    }

    fs.writeFileSync(CSV_FILE, csvRows.join('\n'), 'utf-8')
    console.log(`✅ Keywords successfully exported to ${CSV_FILE}`)
  } catch (error) {
    console.error('❌ Error exporting keywords to CSV:', error)
  }
}

// Run if called directly
const isMain = process.argv[1] && (
  path.resolve(process.argv[1]) === path.resolve(__filename) ||
  path.resolve(process.argv[1]).endsWith('export-keywords-csv.ts')
)

if (isMain) {
  exportToCsv()
}
