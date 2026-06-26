/**
 * Keyword coverage audit — shared, server-side core.
 *
 * SERVER ONLY. This module imports `analyzeKeywordChecks` from `seoAnalyzer`,
 * which depends on `natural` (the NLP stemmer). It MUST NEVER be imported by
 * client/admin bundle code. The admin coverage view (plan 23-02) reaches this
 * logic through a server endpoint, exactly like /api/seo/keyword-score — never
 * by importing this file directly into a React client component.
 *
 * Two pieces:
 *   - `auditDoc()`  — pure, payload-free bucketing unit (unit-tested).
 *   - `runKeywordCoverageAudit(payload)` — orchestrator that hits the live DB
 *     (AUDIT-03: every call reflects current state, no caching/hardcoding).
 */
import { analyzeKeywordChecks } from './seoAnalyzer'
import type { KeywordCheckId } from '../types/keywordScore'

export type AuditCollection = 'posts' | 'pages' | 'categories' | 'users'
export type CoverageBucket = 'noKeyword' | 'failing' | 'passing'

export interface CoverageRow {
  collection: AuditCollection
  id: string
  label: string
  url?: string
  /** The resolved keyword string, or null when none is assigned. */
  keyword: string | null
  bucket: CoverageBucket
  /** Weighted 0-100 score from the analyzer (only when a keyword is present). */
  score?: number
  /** Applicable checks that came back RED. */
  failingChecks: KeywordCheckId[]
  /** Applicable checks that came back AMBER (warnings, not failures). */
  amberChecks: KeywordCheckId[]
  /** Checks that don't apply to this doc (e.g. body checks on a listing). */
  naChecks: KeywordCheckId[]
}

export interface KeywordCoverageReport {
  /** ISO timestamp of when this run was produced. */
  generatedAt: string
  counts: {
    total: number
    noKeyword: number
    failing: number
    passing: number
  }
  noKeyword: CoverageRow[]
  failing: CoverageRow[]
  passing: CoverageRow[]
}

/** The content checks that require a document body. Listings have no body. */
const CONTENT_CHECKS: KeywordCheckId[] = ['h1', 'density', 'firstParagraph', 'subheadings']

export interface AuditDocArgs {
  collection: AuditCollection
  id: string
  label: string
  url?: string
  keyword: string | null
  title?: string
  meta?: { title?: string; description?: string }
  slug?: string
  content?: unknown
  /** True for listings (categories/users) which have no editable body. */
  isListing: boolean
  locale: 'es' | 'en'
}

/**
 * Pure bucketing unit. Given one document's already-extracted fields, decides
 * whether it has no keyword (AUDIT-01), or fails / passes the applicable
 * traffic-light checks (AUDIT-02). N/A checks never flip the bucket.
 */
export function auditDoc(args: AuditDocArgs): CoverageRow {
  const { collection, id, label, url, keyword, title, meta, slug, content, isListing, locale } =
    args

  const base: CoverageRow = {
    collection,
    id,
    label,
    url,
    keyword: keyword && keyword.trim() ? keyword.trim() : null,
    bucket: 'noKeyword',
    failingChecks: [],
    amberChecks: [],
    naChecks: [],
  }

  // AUDIT-01: no keyword assigned → nothing to score.
  if (!base.keyword) {
    return base
  }

  // Determine which checks are N/A for this document.
  // Driven purely by `isListing` (body checks) + which sources were supplied
  // (an undefined title/slug/meta source means that check cannot apply).
  const naSet = new Set<KeywordCheckId>()
  if (isListing) {
    for (const c of CONTENT_CHECKS) naSet.add(c)
  }
  if (title === undefined) naSet.add('title')
  if (slug === undefined) naSet.add('slug')
  if (meta === undefined) naSet.add('metaDescription')

  const result = analyzeKeywordChecks({
    keyword: base.keyword,
    title,
    meta,
    slug,
    content,
    locale,
  })

  const failingChecks: KeywordCheckId[] = []
  const amberChecks: KeywordCheckId[] = []
  const naChecks: KeywordCheckId[] = []

  for (const check of result.checks) {
    if (naSet.has(check.id)) {
      naChecks.push(check.id)
      continue
    }
    if (check.state === 'red') failingChecks.push(check.id)
    else if (check.state === 'amber') amberChecks.push(check.id)
  }

  // AUDIT-02: any applicable RED check buckets the doc as failing. Amber is a
  // warning, not a failure (planner discretion, per CONTEXT). N/A checks are
  // excluded above, so a listing without a body can never be marked failing
  // for the missing content checks.
  return {
    ...base,
    bucket: failingChecks.length > 0 ? 'failing' : 'passing',
    score: result.score,
    failingChecks,
    amberChecks,
    naChecks,
  }
}

/** Narrow the populated `primaryKeyword` relationship to its keyword string. */
function extractKeyword(primaryKeyword: unknown): string | null {
  if (primaryKeyword && typeof primaryKeyword === 'object') {
    const kw = (primaryKeyword as { keyword?: unknown }).keyword
    if (typeof kw === 'string' && kw.trim()) return kw.trim()
  }
  // Unpopulated relationship (still a string id) → treat as no keyword.
  return null
}

/** Best-effort admin edit link — always correct regardless of public routing. */
function editUrl(collection: AuditCollection, id: string): string {
  return `/admin/collections/${collection}/${id}`
}

/** Loose doc shape: payload's generated types vary, we read defensively. */
interface RawDoc {
  id: string | number
  title?: string
  name?: string
  slug?: string
  meta?: { title?: string; description?: string }
  content?: { content?: unknown; layout?: unknown }
  primaryKeyword?: unknown
}

/**
 * Orchestrator: queries every audited collection live (AUDIT-03) and returns a
 * structured report split into the two coverage lists plus the passing set.
 */
export async function runKeywordCoverageAudit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: { find: (args: any) => Promise<{ docs: any[] }> },
  opts?: { locale?: 'es' | 'en' },
): Promise<KeywordCoverageReport> {
  const locale = opts?.locale ?? 'es'
  const rows: CoverageRow[] = []

  // Bounded query: limit 1000 per collection, depth 1 so primaryKeyword
  // resolves to its keyword-metrics doc (T-23-03: DoS bound).
  const [posts, pages, categories, users] = await Promise.all([
    payload.find({ collection: 'posts', depth: 1, limit: 1000, locale }),
    payload.find({ collection: 'pages', depth: 1, limit: 1000, locale }),
    payload.find({ collection: 'categories', depth: 1, limit: 1000, locale }),
    payload.find({ collection: 'users', depth: 1, limit: 1000, locale }),
  ])

  for (const raw of posts.docs as RawDoc[]) {
    const id = String(raw.id)
    rows.push(
      auditDoc({
        collection: 'posts',
        id,
        label: raw.title ?? id,
        url: editUrl('posts', id),
        keyword: extractKeyword(raw.primaryKeyword),
        title: raw.title,
        meta: raw.meta,
        slug: raw.slug,
        content: raw.content?.content,
        isListing: false,
        locale,
      }),
    )
  }

  for (const raw of pages.docs as RawDoc[]) {
    const id = String(raw.id)
    rows.push(
      auditDoc({
        collection: 'pages',
        id,
        label: raw.title ?? id,
        url: editUrl('pages', id),
        keyword: extractKeyword(raw.primaryKeyword),
        title: raw.title,
        meta: raw.meta,
        slug: raw.slug,
        content: raw.content?.layout,
        isListing: false,
        locale,
      }),
    )
  }

  for (const raw of categories.docs as RawDoc[]) {
    const id = String(raw.id)
    rows.push(
      auditDoc({
        collection: 'categories',
        id,
        label: raw.title ?? id,
        url: editUrl('categories', id),
        keyword: extractKeyword(raw.primaryKeyword),
        title: raw.title,
        slug: raw.slug,
        // No body, no meta field → those checks resolve to N/A.
        isListing: true,
        locale,
      }),
    )
  }

  for (const raw of users.docs as RawDoc[]) {
    const id = String(raw.id)
    rows.push(
      auditDoc({
        collection: 'users',
        id,
        label: raw.name ?? id,
        url: editUrl('users', id),
        keyword: extractKeyword(raw.primaryKeyword),
        // Users use their name as the "title"; no public slug, no meta field.
        title: raw.name,
        isListing: true,
        locale,
      }),
    )
  }

  const noKeyword = rows.filter((r) => r.bucket === 'noKeyword')
  const failing = rows.filter((r) => r.bucket === 'failing')
  const passing = rows.filter((r) => r.bucket === 'passing')

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      total: rows.length,
      noKeyword: noKeyword.length,
      failing: failing.length,
      passing: passing.length,
    },
    noKeyword,
    failing,
    passing,
  }
}
