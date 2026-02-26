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
  status?: string
  lastUpdated?: string
  source: string
  paaCount?: number
  topDomain?: string
  hasAiOverview?: boolean
  competitorHeadings?: string
  competitorMeta?: string
  avgWordCount?: number
  opportunityScore?: number
  recommendedFormat?: string
  clusterType?: 'Pillar' | 'Supporting'
  funnelStage?: 'Awareness (TOFU)' | 'Consideration (MOFU)' | 'Decision (BOFU)'
  informationGain?: string
  post?: string
  page?: string
}

const unescapeFromTable = (text: string): string => {
  if (!text) return ''
  return text.replace(/\\\|/g, '|')
}

const getDocumentFromURL = async (payload: any, url: string): Promise<{ id: string, collection: 'posts' | 'pages' } | null> => {
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
    return { id: String(posts.docs[0].id), collection: 'posts' }
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
    return { id: String(pages.docs[0].id), collection: 'pages' }
  }

  return null
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
    
    // Split by pipe but ignore escaped pipes
    const parts = line.split(/(?<!\\)\|/).map(p => p.trim())
    
    if (parts.length > 0 && parts[0] === '') parts.shift()
    if (parts.length > 0 && parts[parts.length - 1] === '') parts.pop()

    if (parts.length < 7) continue

    const keyword = unescapeFromTable(parts[0])
    if (!keyword || keyword === 'Keyword') continue

    // Detect if it's the new format (22 columns) or old format
    const isNewFormat = parts.length >= 20

    keywords.push({
      keyword,
      targetURL: unescapeFromTable(parts[1]),
      volume: parseInt(parts[2], 10) || 0,
      difficulty: parseInt(parts[3], 10) || 0,
      intent: (['Informational', 'Commercial', 'Transactional', 'Navigational'].includes(parts[4]) ? parts[4] : 'Informational') as KeywordData['intent'],
      status: unescapeFromTable(parts[5]),
      lastUpdated: unescapeFromTable(parts[6]),
      source: unescapeFromTable(parts[7]) || 'Manual',
      paaCount: parseInt(parts[9], 10) || 0,
      topDomain: unescapeFromTable(parts[10]),
      hasAiOverview: parts[11] === 'Yes',
      competitorHeadings: unescapeFromTable(parts[13]),
      competitorMeta: unescapeFromTable(parts[14]),
      avgWordCount: isNewFormat ? parseInt(parts[15], 10) || 0 : 0,
      opportunityScore: parseInt(isNewFormat ? parts[16] : parts[15], 10) || 0,
      recommendedFormat: unescapeFromTable(isNewFormat ? parts[17] : parts[16] || ''),
      clusterType: (unescapeFromTable(isNewFormat ? parts[18] : parts[17] || '') === 'Pillar' ? 'Pillar' : 'Supporting') as KeywordData['clusterType'],
      funnelStage: (['Awareness (TOFU)', 'Consideration (MOFU)', 'Decision (BOFU)'].includes(unescapeFromTable(isNewFormat ? parts[20] : '')) 
        ? unescapeFromTable(isNewFormat ? parts[20] : '') 
        : undefined) as KeywordData['funnelStage'],
      informationGain: unescapeFromTable(isNewFormat ? parts[21] : ''),
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
      // Try to find the associated document (post or page)
      const linkedDoc = await getDocumentFromURL(payload, kwData.targetURL)
      if (linkedDoc) {
        if (linkedDoc.collection === 'posts') {
          kwData.post = linkedDoc.id
        } else if (linkedDoc.collection === 'pages') {
          kwData.page = linkedDoc.id
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
