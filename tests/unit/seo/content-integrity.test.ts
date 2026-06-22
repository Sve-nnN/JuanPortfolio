import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import path from 'path'

/**
 * Content integrity regression suite (SEO audit jun-2026):
 * #22 duplicated slug-prefix titles, #23 broken wikilinks, #53 idioma mismatch,
 * #56 broken apostrophes. Guards the markdown corpus at deploy time.
 */
const POSTS_DIR = path.resolve(__dirname, '../../../content/posts')

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.name.endsWith('.md')) out.push(full)
  }
  return out
}

function baseSlug(file: string): string {
  let b = path.basename(file).replace(/\.md$/, '')
  if (b.endsWith('.en') || b.endsWith('.es')) b = b.slice(0, -3)
  return b
}

function frontmatter(text: string): string {
  const m = text.match(/^---\n([\s\S]*?)\n---/)
  return m ? m[1] : ''
}

function norm(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const files = walk(POSTS_DIR)
const validSlugs = new Set(files.map(baseSlug))

// Targets known to reference an as-yet-unpublished draft post.
const WIKILINK_ALLOWLIST = new Set(['javascript-seo-guia'])

describe('content corpus', () => {
  it('has a non-trivial number of posts', () => {
    expect(files.length).toBeGreaterThan(100)
  })

  it('contains no broken apostrophes (Developer"s) — issue #56', () => {
    const offenders = files.filter((f) => /[A-Za-z]"[A-Za-z]/.test(readFileSync(f, 'utf-8')))
    expect(offenders.map((f) => path.relative(POSTS_DIR, f))).toEqual([])
  })

  it('has no wikilinks pointing to non-existent slugs — issue #23', () => {
    const broken: string[] = []
    for (const f of files) {
      const body = readFileSync(f, 'utf-8')
      const matches = body.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)
      for (const m of matches) {
        const target = m[1].trim()
        if (validSlugs.has(target) || WIKILINK_ALLOWLIST.has(target)) continue
        broken.push(`${path.relative(POSTS_DIR, f)} -> [[${target}]]`)
      }
    }
    expect(broken).toEqual([])
  })

  it('has idioma matching the file language — issue #53', () => {
    const mismatched: string[] = []
    for (const f of files) {
      const fm = frontmatter(readFileSync(f, 'utf-8'))
      const m = fm.match(/^idioma:\s*(.*)$/m)
      if (!m) continue
      const want = f.endsWith('.en.md') ? 'en' : 'es'
      const got = m[1].trim().replace(/['"]/g, '')
      if (got && got !== want) mismatched.push(`${path.relative(POSTS_DIR, f)}: ${got} != ${want}`)
    }
    expect(mismatched).toEqual([])
  })

  it('has no title with a duplicated slug/topic prefix — issue #22', () => {
    const stuffed: string[] = []
    for (const f of files) {
      const fm = frontmatter(readFileSync(f, 'utf-8'))
      const m = fm.match(/^title:\s*(.+)$/m)
      if (!m) continue
      let v = m[1].trim().replace(/^['"]|['"]$/g, '')
      if (!v.includes(': ')) continue
      const [prefix, rest] = [v.slice(0, v.indexOf(': ')), v.slice(v.indexOf(': ') + 2)]
      const restFirst = rest.split(': ')[0]
      const np = norm(prefix)
      const pwords = np.split(' ').filter(Boolean)
      const rwords = new Set(norm(rest).split(' '))
      const duplicated =
        np === norm(restFirst) || (pwords.length >= 2 && pwords.every((w) => rwords.has(w)))
      if (duplicated) stuffed.push(`${path.relative(POSTS_DIR, f)}: ${v.slice(0, 70)}`)
    }
    expect(stuffed).toEqual([])
  })
})
