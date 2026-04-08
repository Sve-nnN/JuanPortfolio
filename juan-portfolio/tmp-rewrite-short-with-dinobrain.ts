import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { DinoBrainApiAdapter } from './src/scripts/dinorank/DinoBrainApiAdapter'
import { DinoRankApiClient } from './src/scripts/dinorank/DinoRankApiClient'

interface Candidate {
  filePath: string
  relPath: string
  locale: 'en' | 'es'
  category: string
  slug: string
  words: number
  reason: 'placeholder' | 'short'
  keyword: string
}

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.isFile() && full.endsWith('.md')) out.push(full)
  }
  return out
}

function parseLocaleAndSlug(filename: string): { locale: 'en' | 'es'; slug: string } {
  if (filename.endsWith('.en.md')) return { locale: 'en', slug: filename.replace(/\.en\.md$/, '') }
  if (filename.endsWith('.es.md')) return { locale: 'es', slug: filename.replace(/\.es\.md$/, '') }
  return { locale: 'es', slug: filename.replace(/\.md$/, '') }
}

function parseBacklog(filePath: string): Map<string, string> {
  const text = fs.readFileSync(filePath, 'utf8')
  const map = new Map<string, string>()

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line.startsWith('|') || line.startsWith('| :---')) continue
    const cols = line.split('|').slice(1, -1).map((c) => c.trim())
    if (cols.length < 3) continue

    const keyword = cols[0]
    const targetUrl = cols[1]
    const language = (cols[2] || '').toLowerCase()
    if (!keyword || keyword.toLowerCase() === 'keyword') continue
    if (!targetUrl.startsWith('/')) continue

    const parts = targetUrl.replace(/^\//, '').split('/').filter(Boolean)
    if (parts.length < 2) continue

    const hasLocalePrefix = parts[0] === 'en' || parts[0] === 'es'
    const category = hasLocalePrefix ? parts[1] : parts[0]
    const slug = hasLocalePrefix ? parts[2] : parts[1]
    if (!category || !slug) continue

    const locale = language === 'en' || parts[0] === 'en' ? 'en' : 'es'
    map.set(`${locale}:${category}:${slug}`, keyword)
  }

  return map
}

function countWords(markdownBody: string): number {
  return markdownBody
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[>#*_`\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length
}

function cleanText(input: string): string {
  return String(input || '').replace(/\s+/g, ' ').trim()
}

function deriveMetaTitle(title: string): string {
  const brand = ' | Juan Tech'
  const maxCore = 60 - brand.length
  let core = cleanText(title)
  if (core.length > maxCore) core = core.slice(0, maxCore).trim()
  return `${core}${brand}`
}

function deriveMetaDescription(body: string, keyword: string, locale: 'en' | 'es'): string {
  const base = cleanText(body.replace(/^#+\s+/gm, ' '))
  let desc = base.slice(0, 220)

  if (!desc.toLowerCase().includes(keyword.toLowerCase())) {
    desc = locale === 'en'
      ? `Learn ${keyword} with practical examples, clear steps, and actionable recommendations to improve your results.`
      : `Aprende ${keyword} con ejemplos practicos, pasos claros y recomendaciones accionables para mejorar tus resultados.`
  }

  if (desc.length < 140) {
    const extra = locale === 'en'
      ? ' Includes strategy, implementation tips, and common mistakes to avoid.'
      : ' Incluye estrategia, consejos de implementacion y errores comunes que debes evitar.'
    desc = cleanText(`${desc} ${extra}`)
  }

  if (desc.length > 155) desc = `${desc.slice(0, 152).trim()}...`
  return desc
}

async function logoutAllActiveSessions(root: string): Promise<void> {
  const sessionFile = path.join(root, 'content', 'dinorank-kw-session.json')
  if (!fs.existsSync(sessionFile)) return

  try {
    const raw = fs.readFileSync(sessionFile, 'utf8')
    const parsed = JSON.parse(raw) as Record<string, unknown>

    for (const email of Object.keys(parsed || {})) {
      const client = new DinoRankApiClient(email, '', sessionFile)
      await client.logout().catch(() => undefined)
    }
  } catch {
    // Keep rewriting flow alive when session cleanup fails.
  }
}

async function main() {
  const root = process.cwd()
  const postsRoot = path.join(root, 'content', 'posts')
  const backlogPath = path.join(root, 'content', 'keywords_backlog.md')

  const args = process.argv.slice(2)
  const limitArg = args.find((a) => a.startsWith('--limit='))
  const limit = limitArg ? Number.parseInt(limitArg.split('=')[1] || '0', 10) : Number.POSITIVE_INFINITY
  const shortThresholdArg = args.find((a) => a.startsWith('--short-threshold='))
  const shortThreshold = shortThresholdArg ? Number.parseInt(shortThresholdArg.split('=')[1] || '0', 10) : 180

  const keywordMap = parseBacklog(backlogPath)
  const files = walk(postsRoot)

  const candidates: Candidate[] = []

  for (const filePath of files) {
    const relPath = path.relative(root, filePath)
    const parsed = matter(fs.readFileSync(filePath, 'utf8'))
    const body = parsed.content || ''
    const words = countWords(body)

    const placeholder = body.includes('English version coming soon.')
    const short = words > 0 && words < shortThreshold
    if (!placeholder && !short) continue

    const category = relPath.split(path.sep)[2]
    const filename = path.basename(filePath)
    const { locale, slug } = parseLocaleAndSlug(filename)

    const keyword = keywordMap.get(`${locale}:${category}:${slug}`) || String(parsed.data.keyword || slug.replace(/-/g, ' '))

    candidates.push({
      filePath,
      relPath,
      locale,
      category,
      slug,
      words,
      reason: placeholder ? 'placeholder' : 'short',
      keyword,
    })
  }

  candidates.sort((a, b) => {
    if (a.reason !== b.reason) return a.reason === 'placeholder' ? -1 : 1
    return a.words - b.words
  })

  const selected = candidates.slice(0, Number.isFinite(limit) ? limit : candidates.length)
  console.log(`candidates_total=${candidates.length}`)
  console.log(`selected=${selected.length}`)

  const failures: Array<{ file: string; error: string }> = []
  let success = 0

  for (let i = 0; i < selected.length; i += 1) {
    const c = selected[i]
    console.log(`[${i + 1}/${selected.length}] ${c.relPath} (${c.reason}, words=${c.words}) keyword="${c.keyword}"`)

    try {
      const language = c.locale === 'en' ? 'en' : 'es'
      const country = c.locale === 'en' ? 'US' : 'ES'
      const adapter = new DinoBrainApiAdapter()

      const generated = await adapter.generate({
        keyword: c.keyword,
        language,
        country,
        domain: 'juan-tech.com',
        siteType: 'nicho',
        numWords: 2000,
      })

      const parsed = matter(fs.readFileSync(c.filePath, 'utf8'))
      const title = cleanText(generated.title || parsed.data.title || c.keyword)
      const metaTitle = deriveMetaTitle(title)
      const metaDescription = deriveMetaDescription(generated.markdown, c.keyword, c.locale)

      const nextData = {
        ...parsed.data,
        title,
        metaTitle,
        metaDescription,
        keyword: c.keyword,
        idioma: c.locale,
      }

      const nextRaw = matter.stringify(generated.markdown, nextData)
      fs.writeFileSync(c.filePath, nextRaw, 'utf8')
      success += 1
      console.log('  -> rewritten')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failures.push({ file: c.relPath, error: message })
      console.log(`  -> failed: ${message}`)
    } finally {
      await logoutAllActiveSessions(root)
      console.log('  -> logout done')
    }
  }

  console.log(`success=${success}`)
  console.log(`failed=${failures.length}`)
  if (failures.length > 0) {
    for (const f of failures) {
      console.log(`FAIL ${f.file}: ${f.error}`)
    }
  }
}

void main()
