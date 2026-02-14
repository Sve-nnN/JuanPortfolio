import fs from 'fs'
import path from 'path'
import { extractPhrases, GapCandidate } from './keyword-utils'

const KEYWORDS_FILE_PATH = path.join(process.cwd(), 'content', 'keywords.md')

interface KeywordEntry {
  keyword: string
  relatedSearches: string[]
  competitorHeadings: string
  competitorMeta: string
}

function parseKeywordsFile(): KeywordEntry[] {
  if (!fs.existsSync(KEYWORDS_FILE_PATH)) return []
  const content = fs.readFileSync(KEYWORDS_FILE_PATH, 'utf-8')
  const lines = content.split('\n')
  const entries: KeywordEntry[] = []

  let headerProcessed = false
  let separatorProcessed = false
  for (const line of lines) {
    if (line.includes('| Keyword') && line.trim().startsWith('|')) {
      headerProcessed = true
      continue
    }
    if (headerProcessed && !separatorProcessed && line.includes('---')) {
      separatorProcessed = true
      continue
    }
    if (headerProcessed && separatorProcessed && line.trim().startsWith('|')) {
      const parts = line.split(/(?<!\\)\|/).map(p => p.trim())
      
      if (parts.length > 0 && parts[0] === '') parts.shift()
      
      if (parts.length < 15) continue
      
      entries.push({
        keyword: parts[0].replace(/\\\|/g, '|'),
        relatedSearches: parts[8].split(';').map(s => s.trim()).filter(s => s),
        competitorHeadings: parts[13].replace(/\\\|/g, '|'),
        competitorMeta: parts[14].replace(/\\\|/g, '|')
      })
    }
  }
  return entries
}

async function analyzeGap() {
  console.log('\x1b[36m🔍 Analizando Keyword Gap entre competidores...\x1b[0m\n')
  
  const currentEntries = parseKeywordsFile()
  if (currentEntries.length === 0) {
    console.log('\x1b[31m❌ No se pudieron cargar las keywords actuales.\x1b[0m')
    return
  }

  const existingKeywords = new Set(currentEntries.map(e => e.keyword.toLowerCase()))
  const candidates = new Map<string, GapCandidate>()

  for (const entry of currentEntries) {
    // 1. Process Related Searches (Highest trust)
    for (const rel of entry.relatedSearches) {
      const kw = rel.toLowerCase().trim()
      if (existingKeywords.has(kw) || kw.length < 4) continue
      
      const prev = candidates.get(kw) || { keyword: rel, score: 0, foundIn: [], source: 'related' }
      // Cap contribution from a single source
      if (!prev.foundIn.includes(entry.keyword)) {
        prev.score += 5 // Increased weight for explicit Google suggestions
        prev.foundIn.push(entry.keyword)
      }
      candidates.set(kw, prev)
    }

    // 2. Process Competitor Headings (Discovery)
    const phrases = extractPhrases(entry.competitorHeadings)
    // Use a Set to only count a phrase once per source post
    const uniquePhrasesInEntry = new Set(phrases)
    
    for (const phrase of uniquePhrasesInEntry) {
      const kw = phrase.toLowerCase().trim()
      if (existingKeywords.has(kw) || kw.length < 4) continue
      
      // Filter out common technical noise attributes
      if (kw.includes('data color') || kw.includes('focus data') || kw.includes('hover data')) continue

      const prev = candidates.get(kw) || { keyword: phrase, score: 0, foundIn: [], source: 'competitor' }
      if (!prev.foundIn.includes(entry.keyword)) {
        prev.score += 1
        prev.foundIn.push(entry.keyword)
      }
      candidates.set(kw, prev)
    }
  }

  // Filter and Sort
  const sortedGaps = Array.from(candidates.values())
    .filter(g => {
      // Final heuristic filters
      if (g.keyword.split(' ').length < 2) return false // Require at least 2 words
      if (g.score < 2) return false
      return true
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)

  if (sortedGaps.length === 0) {
    console.log('\x1b[33m✅ No se encontraron gaps significativos. ¡Tu cobertura es excelente!\x1b[0m')
    return
  }

  console.log('\x1b[1m🏆 Top Oportunidades Encontradas:\x1b[0m')
  sortedGaps.forEach((gap, i) => {
    console.log(`${i + 1}. \x1b[32m${gap.keyword}\x1b[0m (Score: ${gap.score}) - Visto en: ${gap.foundIn.slice(0, 2).join(', ')}`)
  })

  const appendLines: string[] = []
  for (const gap of sortedGaps) {
    const row = `| ${gap.keyword} | /gap/${gap.keyword.toLowerCase().replace(/\s+/g, '-')} | 0 | 0 | Informational | Gap | | GapAnalyzer | | 0 | | No | | | | 0 | 0 | Blog | Supporting | | Awareness (TOFU) | |`
    appendLines.push(row)
  }

  if (appendLines.length > 0) {
    console.log(`\n\x1b[34m✍️  Añadiendo ${appendLines.length} nuevas keywords a keywords.md...\x1b[0m`)
    fs.appendFileSync(KEYWORDS_FILE_PATH, appendLines.join('\n') + '\n')
    console.log('\x1b[32m✨ ¡Proceso completado!\x1b[0m Ejecuta el script de métricas para poblar los datos.')
  }
}

analyzeGap().catch(console.error)
