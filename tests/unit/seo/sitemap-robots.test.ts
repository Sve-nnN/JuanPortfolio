import { describe, it, expect } from 'vitest'
import { existsSync } from 'fs'
import path from 'path'
import robots from '@/app/robots'
import {
  getChildSitemapUrls,
  SITEMAP_CHILDREN,
  buildPagesSitemap,
  STATIC_PAGE_PATHS,
  buildAlternateRefs,
} from '@/utilities/sitemap'

const PROJECT_ROOT = path.resolve(__dirname, '../../..')

/**
 * Regression suite for the SEO audit (jun-2026) indexability fixes:
 * issues #13 (broken master sitemap), #15 (/api/ crawlable), #17 (incomplete
 * pages-sitemap). These guard against re-introducing the crawl/index breakage
 * that left Google with a single indexed URL.
 */
describe('robots.txt rules (issue #15)', () => {
  it('disallows both /admin and /api/', () => {
    const result = robots()
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules
    const disallow = rules?.disallow
    const list = Array.isArray(disallow) ? disallow : [disallow]
    expect(list).toContain('/admin')
    expect(list).toContain('/api/')
  })

  it('advertises the master sitemap index', () => {
    const result = robots()
    const sitemaps = Array.isArray(result.sitemap) ? result.sitemap : [result.sitemap]
    expect(sitemaps.some((s) => s?.endsWith('/sitemap.xml'))).toBe(true)
  })
})

describe('master sitemap index (issue #13)', () => {
  it('references the 4 real child sitemaps, absolute and https-able', () => {
    const urls = getChildSitemapUrls('https://juan-tech.com')
    expect(urls).toHaveLength(4)
    expect(urls).toEqual([
      'https://juan-tech.com/pages-sitemap.xml',
      'https://juan-tech.com/posts-sitemap.xml',
      'https://juan-tech.com/categories-sitemap.xml',
      'https://juan-tech.com/authors-sitemap.xml',
    ])
  })

  it('never lists robots.txt or itself as a child (the old broken behavior)', () => {
    const urls = getChildSitemapUrls('https://juan-tech.com')
    expect(urls.some((u) => u.endsWith('/robots.txt'))).toBe(false)
    expect(urls.some((u) => u.endsWith('/sitemap.xml'))).toBe(false)
    expect(SITEMAP_CHILDREN).not.toContain('robots.txt')
  })

  it('does not leave stale next-sitemap artifacts in /public', () => {
    expect(existsSync(path.join(PROJECT_ROOT, 'public/sitemap.xml'))).toBe(false)
    expect(existsSync(path.join(PROJECT_ROOT, 'public/sitemap-0.xml'))).toBe(false)
    expect(existsSync(path.join(PROJECT_ROOT, 'public/robots.txt'))).toBe(false)
  })
})

describe('pages-sitemap completeness (issue #17)', () => {
  const entries = buildPagesSitemap('https://juan-tech.com', [
    { slug: 'home', updatedAt: '2026-01-01T00:00:00.000Z' },
  ])
  const locs = entries.map((e) => e.loc)

  it('includes the homepage for both locales (no trailing slash, matching canonical)', () => {
    expect(locs).toContain('https://juan-tech.com')
    expect(locs).toContain('https://juan-tech.com/en')
  })

  it('includes every static indexable page for both locales', () => {
    for (const p of STATIC_PAGE_PATHS) {
      if (p === '') continue
      expect(locs).toContain(`https://juan-tech.com${p}`)
      expect(locs).toContain(`https://juan-tech.com/en${p}`)
    }
  })

  it('excludes the utility /search results page', () => {
    expect(locs.some((l) => l.includes('/search'))).toBe(false)
  })

  it('does not duplicate the homepage from a `home` page document', () => {
    const homeCount = locs.filter((l) => l === 'https://juan-tech.com').length
    expect(homeCount).toBe(1)
  })
})


describe('hreflang alternates (issue #35)', () => {
  it('buildAlternateRefs emits es/en/x-default, all absolute', () => {
    const refs = buildAlternateRefs('https://juan-tech.com/blog', 'https://juan-tech.com/en/blog')
    expect(refs.map((r) => r.hreflang).sort()).toEqual(['en', 'es', 'x-default'])
    expect(refs.every((r) => r.hrefIsAbsolute)).toBe(true)
    expect(refs.find((r) => r.hreflang === 'x-default')!.href).toBe('https://juan-tech.com/blog')
  })

  it('pages-sitemap entries carry hreflang alternates', () => {
    const entries = buildPagesSitemap('https://juan-tech.com')
    const blogEs = entries.find((e) => e.loc === 'https://juan-tech.com/blog')
    expect(blogEs?.alternateRefs?.length).toBe(3)
    expect(blogEs?.alternateRefs?.find((r) => r.hreflang === 'en')?.href).toBe(
      'https://juan-tech.com/en/blog',
    )
  })
})
