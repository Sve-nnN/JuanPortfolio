import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../payload.config'

const KEYWORDS_FILE = path.resolve(process.cwd(), 'content/keywords.md')

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
}

interface KeywordData {
  keyword: string
  targetURL: string
  volume: number
  difficulty: number
  intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational'
  source: string
}

const parseKeywordsMarkdown = (content: string): KeywordData[] => {
  const lines = content.split('\n')
  const keywords: KeywordData[] = []

  // Skip header and separator
  const dividerIndex = lines.findIndex(l => l.includes('---'))
  if (dividerIndex === -1) return []
  
  const dataLines = lines.slice(dividerIndex + 1)

  for (const line of dataLines) {
    if (!line.trim() || !line.startsWith('|')) continue
    
    const parts = line.split('|').map(p => p.trim())
    
    if (parts.length < 8) continue

    const keyword = parts[1]
    if (!keyword || keyword === 'Keyword') continue

    keywords.push({
      keyword,
      targetURL: parts[2],
      volume: parseInt(parts[3], 10) || 0,
      difficulty: parseInt(parts[4], 10) || 0,
      intent: (['Informational', 'Commercial', 'Transactional', 'Navigational'].includes(parts[5]) ? parts[5] : 'Informational') as KeywordData['intent'],
      source: parts[8] || 'Manual',
    })
  }

  return keywords
}

const syncKeywords = async () => {
  console.log(`${colors.blue}⏳ Initializing Payload...${colors.reset}`)
  const payload = await getPayload({ config })

  if (!fs.existsSync(KEYWORDS_FILE)) {
    console.error(`${colors.red}❌ Keywords file not found: ${KEYWORDS_FILE}${colors.reset}`)
    process.exit(1)
  }

  console.log(`${colors.blue}📖 Parsing ${KEYWORDS_FILE}...${colors.reset}`)
  const content = fs.readFileSync(KEYWORDS_FILE, 'utf-8')
  const keywords = parseKeywordsMarkdown(content)

  console.log(`${colors.blue}🔄 Syncing ${keywords.length} keywords to Payload...${colors.reset}`)

  let created = 0
  let updated = 0

  for (const kwData of keywords) {
    try {
      const existing = await payload.find({
        collection: 'keyword-metrics',
        where: { keyword: { equals: kwData.keyword } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        await payload.update({
          collection: 'keyword-metrics',
          id: existing.docs[0].id,
          data: kwData,
        })
        updated++
      } else {
        await payload.create({
          collection: 'keyword-metrics',
          data: kwData,
        })
        created++
      }
    } catch (e) {
      console.error(`${colors.red}❌ Error syncing keyword "${kwData.keyword}": ${e}${colors.reset}`)
    }
  }

  console.log(`\n${colors.green}✅ Sync Complete!${colors.reset}`)
  console.log(`   Created: ${created}`)
  console.log(`   Updated: ${updated}`)
  
  process.exit(0)
}

syncKeywords()
