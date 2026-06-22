import { getServerSideURL } from './getURL'

/**
 * Pure sitemap/robots helpers, extracted from the route handlers so they can be
 * unit-tested without booting Payload. Guards the SEO audit (jun-2026)
 * indexability fixes: issues #13 (broken master sitemap) and #17 (incomplete
 * pages-sitemap). Locale-prefix convention: es (default) = no prefix, en = `/en`.
 */

export const LOCALES = ['es', 'en'] as const

/**
 * Child sitemaps referenced by the master sitemap index served at /sitemap.xml.
 * This index is what robots.txt advertises and what gets submitted to Google
 * Search Console, so it MUST list the real content sitemaps (not robots.txt).
 */
export const SITEMAP_CHILDREN = [
  'pages-sitemap.xml',
  'posts-sitemap.xml',
  'categories-sitemap.xml',
  'authors-sitemap.xml',
] as const

export function getChildSitemapUrls(baseUrl: string = getServerSideURL()): string[] {
  const base = baseUrl.replace(/\/$/, '')
  return SITEMAP_CHILDREN.map((child) => `${base}/${child}`)
}

/**
 * Static, indexable app-router routes that are NOT Payload `pages` documents.
 * The homepage and these listing/legal pages must be discoverable in a sitemap.
 * Issue #17: pages-sitemap previously listed only /search + /blog, omitting the
 * homepage and every static page, while including the utility /search page.
 */
export const STATIC_PAGE_PATHS = [
  '', // homepage
  '/blog',
  '/authors',
  '/case-studies',
  '/contact',
  '/privacy',
  '/terms',
] as const

export interface AlternateRef {
  href: string
  hreflang: string
  hrefIsAbsolute: boolean
}

/**
 * hreflang alternates for a single es/en URL pair, emitted by next-sitemap as
 * <xhtml:link rel="alternate"> annotations. SEO audit jun-2026, issue #35.
 */
export function buildAlternateRefs(esLoc: string, enLoc: string): AlternateRef[] {
  return [
    { href: esLoc, hreflang: 'es', hrefIsAbsolute: true },
    { href: enLoc, hreflang: 'en', hrefIsAbsolute: true },
    { href: esLoc, hreflang: 'x-default', hrefIsAbsolute: true },
  ]
}

export interface SitemapEntry {
  loc: string
  lastmod?: string
  alternateRefs?: AlternateRef[]
}

export type PageDoc = { slug?: string | null; updatedAt?: string | null }

/**
 * Emits es + en variants for static routes and for every published page doc,
 * deduplicated by `loc`. Search/results pages are intentionally excluded.
 */
export function buildPagesSitemap(siteUrl: string, pageDocs: PageDoc[] = []): SitemapEntry[] {
  const base = siteUrl.replace(/\/$/, '')
  const seen = new Set<string>()
  const entries: SitemapEntry[] = []

  const push = (loc: string, lastmod?: string, alternateRefs?: AlternateRef[]) => {
    if (seen.has(loc)) return
    seen.add(loc)
    entries.push({ loc, ...(lastmod ? { lastmod } : {}), ...(alternateRefs ? { alternateRefs } : {}) })
  }

  // Emit es + en for each path, each carrying the full hreflang alternates set.
  const pushPair = (esLoc: string, enLoc: string, lastmod?: string) => {
    const alts = buildAlternateRefs(esLoc, enLoc)
    push(esLoc, lastmod, alts)
    push(enLoc, lastmod, alts)
  }

  for (const path of STATIC_PAGE_PATHS) {
    // homepage must keep a trailing slash on the bare origin
    const esLoc = path === '' ? `${base}/` : `${base}${path}`
    const enLoc = path === '' ? `${base}/en/` : `${base}/en${path}`
    pushPair(esLoc, enLoc)
  }

  for (const page of pageDocs) {
    if (!page?.slug) continue
    if (page.slug === 'home') continue // already covered by the static homepage entry
    pushPair(`${base}/${page.slug}`, `${base}/en/${page.slug}`, page.updatedAt || undefined)
  }

  return entries
}
