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
import type { KeywordCheckId } from './keywordScore'

export type AuditCollection = 'posts' | 'pages' | 'categories' | 'users'
export type CoverageBucket = 'noKeyword' | 'unresolvedKeyword' | 'failing' | 'passing'

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
    /** Docs whose primaryKeyword relation exists but couldn't be resolved. */
    unresolvedKeyword: number
    failing: number
    passing: number
  }
  noKeyword: CoverageRow[]
  /** WR-04: relation present but dangling/unpopulated — not a true "no keyword". */
  unresolvedKeyword: CoverageRow[]
  failing: CoverageRow[]
  passing: CoverageRow[]
  /**
   * WR-02: true when at least one collection had more documents than the
   * per-collection query cap, so the report does not cover every doc.
   */
  truncated: boolean
  /** Per-collection truncation detail (collections that exceeded the cap). */
  truncatedCollections: AuditCollection[]
}

/** The content checks that require a document body. Listings have no body. */
const CONTENT_CHECKS: KeywordCheckId[] = ['h1', 'density', 'firstParagraph', 'subheadings']

export interface AuditDocArgs {
  collection: AuditCollection
  id: string
  label: string
  url?: string
  keyword: string | null
  /**
   * WR-04: true when a primaryKeyword relation IS set but its keyword string
   * could not be resolved (dangling id / unpopulated). Distinct from "no
   * keyword at all" — surfaced as its own bucket, never as noKeyword.
   */
  unresolved?: boolean
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
  const { collection, id, label, url, keyword, unresolved, title, meta, slug, content, isListing, locale } =
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

  // AUDIT-01 / WR-04: no resolvable keyword → nothing to score. A dangling
  // relation (set but unresolved) is bucketed separately so it is not counted
  // as a content author forgetting to assign a keyword.
  if (!base.keyword) {
    return unresolved ? { ...base, bucket: 'unresolvedKeyword' } : base
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

/**
 * Narrow the populated `primaryKeyword` relationship to its keyword string.
 *
 * WR-04: distinguishes three states:
 *   - resolved   → { keyword: '<term>', unresolved: false }
 *   - none set   → { keyword: null, unresolved: false }
 *   - dangling   → relation set (non-empty id / object without a keyword)
 *                  but unresolvable → { keyword: null, unresolved: true }
 */
function extractKeyword(primaryKeyword: unknown): { keyword: string | null; unresolved: boolean } {
  // Nothing assigned at all.
  if (primaryKeyword === null || primaryKeyword === undefined) {
    return { keyword: null, unresolved: false }
  }

  if (typeof primaryKeyword === 'object') {
    const kw = (primaryKeyword as { keyword?: unknown }).keyword
    if (typeof kw === 'string' && kw.trim()) return { keyword: kw.trim(), unresolved: false }
    // Object present but no usable keyword field → dangling/unresolved.
    return { keyword: null, unresolved: true }
  }

  // Still a bare id (string/number) → relation set but unpopulated/dangling.
  if (typeof primaryKeyword === 'string') {
    return primaryKeyword.trim()
      ? { keyword: null, unresolved: true }
      : { keyword: null, unresolved: false }
  }
  if (typeof primaryKeyword === 'number') {
    return { keyword: null, unresolved: true }
  }

  return { keyword: null, unresolved: false }
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
/** Per-collection query cap (T-23-03: DoS bound). */
const COLLECTION_LIMIT = 1000

/** Shape we read from a payload `find` result (defensive: extra fields ignored). */
interface FindResult {
  docs: unknown[]
  totalDocs?: number
  hasNextPage?: boolean
}

export async function runKeywordCoverageAudit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: { find: (args: any) => Promise<FindResult> },
  opts?: { locale?: 'es' | 'en' },
): Promise<KeywordCoverageReport> {
  const locale = opts?.locale ?? 'es'
  const rows: CoverageRow[] = []

  // Bounded query: COLLECTION_LIMIT per collection, depth 1 so primaryKeyword
  // resolves to its keyword-metrics doc (T-23-03: DoS bound).
  //
  // CR-01 (ripple): payload.config sets localization.fallback:true +
  // defaultLocale:'es'. Without fallbackLocale:false an empty `en`
  // primaryKeyword reads back the `es` fallback, so the en audit measures
  // coverage against the es value and falsely reports en as covered. Disable
  // fallback so coverage reflects the ACTUAL per-locale keyword (a genuinely
  // empty en surfaces as a real gap).
  const findArgs = (collection: AuditCollection) => ({
    collection,
    depth: 1,
    limit: COLLECTION_LIMIT,
    locale,
    fallbackLocale: false as const,
  })
  const [posts, pages, categories, users] = await Promise.all([
    payload.find(findArgs('posts')),
    payload.find(findArgs('pages')),
    payload.find(findArgs('categories')),
    payload.find(findArgs('users')),
  ])

  // WR-02: detect when a collection has more docs than the cap so truncation is
  // never silent. `totalDocs` is the full match count; `hasNextPage` is a
  // fallback signal if the adapter doesn't return a total.
  const truncatedCollections: AuditCollection[] = []
  const checkTruncation = (collection: AuditCollection, res: FindResult) => {
    const total = typeof res.totalDocs === 'number' ? res.totalDocs : res.docs.length
    if (total > COLLECTION_LIMIT || res.hasNextPage === true) {
      truncatedCollections.push(collection)
    }
  }
  checkTruncation('posts', posts)
  checkTruncation('pages', pages)
  checkTruncation('categories', categories)
  checkTruncation('users', users)

  for (const raw of posts.docs as RawDoc[]) {
    const id = String(raw.id)
    const { keyword, unresolved } = extractKeyword(raw.primaryKeyword)
    rows.push(
      auditDoc({
        collection: 'posts',
        id,
        label: raw.title ?? id,
        url: editUrl('posts', id),
        keyword,
        unresolved,
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
    const { keyword, unresolved } = extractKeyword(raw.primaryKeyword)
    rows.push(
      auditDoc({
        collection: 'pages',
        id,
        label: raw.title ?? id,
        url: editUrl('pages', id),
        keyword,
        unresolved,
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
    const { keyword, unresolved } = extractKeyword(raw.primaryKeyword)
    rows.push(
      auditDoc({
        collection: 'categories',
        id,
        label: raw.title ?? id,
        url: editUrl('categories', id),
        keyword,
        unresolved,
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
    const { keyword, unresolved } = extractKeyword(raw.primaryKeyword)
    rows.push(
      auditDoc({
        collection: 'users',
        id,
        label: raw.name ?? id,
        url: editUrl('users', id),
        keyword,
        unresolved,
        // Users use their name as the "title"; no public slug, no meta field.
        title: raw.name,
        isListing: true,
        locale,
      }),
    )
  }

  const noKeyword = rows.filter((r) => r.bucket === 'noKeyword')
  const unresolvedKeyword = rows.filter((r) => r.bucket === 'unresolvedKeyword')
  const failing = rows.filter((r) => r.bucket === 'failing')
  const passing = rows.filter((r) => r.bucket === 'passing')

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      total: rows.length,
      noKeyword: noKeyword.length,
      unresolvedKeyword: unresolvedKeyword.length,
      failing: failing.length,
      passing: passing.length,
    },
    noKeyword,
    unresolvedKeyword,
    failing,
    passing,
    truncated: truncatedCollections.length > 0,
    truncatedCollections,
  }
}
