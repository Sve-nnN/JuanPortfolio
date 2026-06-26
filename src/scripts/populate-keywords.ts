/**
 * populate-keywords.ts
 *
 * Keyword population (RESEARCH-01/02). Reads content/keywords_map.json (136
 * entries: `slug(.locale)? -> keyword string`) and assigns `primaryKeyword`
 * (localized, see plan 24-01) to the matching Post / Page in the correct
 * locale, linking it to its `keyword-metrics` doc (matched by keyword string,
 * case- and accent-insensitive).
 *
 * Missing metrics docs become `needs-research` stubs (RESEARCH-02); existing
 * docs lacking volume / difficulty / intent are flagged `needs-research` so the
 * Phase 23 coverage audit (AUDIT-01/02) lists them.
 *
 * PREREQUISITE (operator step, NOT re-implemented here):
 *   1. `pnpm sync:keywords`   -> upserts keyword-metrics from content/keywords.md
 *   2. `pnpm populate:keywords --dry-run`  -> preview (no DB writes)
 *   3. `pnpm populate:keywords`            -> populate primaryKeyword + stubs
 *   4. `pnpm audit:keywords`               -> confirm coverage gaps dropped
 *
 * Usage:
 *   pnpm populate:keywords [--dry-run] [--force] [--report]
 *   --dry-run  preview only, no DB writes
 *   --force    overwrite an existing primaryKeyword for that locale
 *   --report   also write content/keyword-population-report.md
 *
 * Idempotent: re-running without --force changes nothing.
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

// ─── helpers ────────────────────────────────────────────────────────────────

const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const FORCE = args.includes('--force')
const REPORT = args.includes('--report')

const MAP_PATH = join(process.cwd(), 'content', 'keywords_map.json')
const REPORT_PATH = join(process.cwd(), 'content', 'keyword-population-report.md')

type Locale = 'es' | 'en'

/** NFD + strip diacritics + lowercase + trim — case/accent-insensitive match. */
const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

/** Resolve `slug(.locale)?` map key -> { slug, locale }. */
function parseKey(key: string): { slug: string; locale: Locale } {
  if (key.endsWith('.en')) return { slug: key.slice(0, -3), locale: 'en' }
  if (key.endsWith('.es')) return { slug: key.slice(0, -3), locale: 'es' }
  return { slug: key, locale: 'es' } // no suffix -> default locale
}

type ResolvedDoc = { collection: 'posts' | 'pages'; id: string | number }

interface RowResult {
  key: string
  slug: string
  locale: Locale
  keyword: string
  outcome:
    | 'set'
    | 'skipped-existing'
    | 'no-doc'
    | 'no-metrics'
    | 'stub-created'
    | 'forced'
  collection?: 'posts' | 'pages'
  metricsId?: string | number
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function resolveDoc(
  payload: Awaited<ReturnType<typeof getPayload>>,
  slug: string,
  locale: Locale,
): Promise<ResolvedDoc | null> {
  const locales: Locale[] = locale === 'es' ? ['es', 'en'] : ['en', 'es']
  for (const loc of locales) {
    for (const collection of ['posts', 'pages'] as const) {
      const res = await payload.find({
        collection,
        where: { slug: { equals: slug } },
        limit: 1,
        locale: loc,
        depth: 0,
      })
      if (res.docs.length > 0) return { collection, id: res.docs[0].id }
    }
  }
  return null
}

async function main() {
  console.log(bold('\n🔑  Populate keywords — juan-tech.com'))
  console.log(
    dim(
      `Mode: ${DRY_RUN ? 'DRY-RUN (no writes)' : 'WRITE'}${FORCE ? ' | FORCE (overwrite)' : ''}\n`,
    ),
  )

  const payload = await getPayload({ config: configPromise })

  const raw = await readFile(MAP_PATH, 'utf8')
  const map = JSON.parse(raw) as Record<string, string>
  const entries = Object.entries(map)

  // Preload all keyword-metrics for normalized matching.
  const metricsByNorm = new Map<string, { id: string | number; keyword: string }>()
  {
    let page = 1
    for (;;) {
      const res = await payload.find({
        collection: 'keyword-metrics',
        limit: 200,
        page,
        depth: 0,
      })
      for (const doc of res.docs) {
        metricsByNorm.set(norm(doc.keyword), { id: doc.id, keyword: doc.keyword })
      }
      if (!res.hasNextPage) break
      page += 1
    }
  }

  const results: RowResult[] = []

  for (const [key, keyword] of entries) {
    const { slug, locale } = parseKey(key)

    const doc = await resolveDoc(payload, slug, locale)
    if (!doc) {
      results.push({ key, slug, locale, keyword, outcome: 'no-doc' })
      continue
    }

    const metrics = metricsByNorm.get(norm(keyword))
    if (!metrics) {
      // Task 2 will create a stub here; Task 1 only reports.
      results.push({
        key,
        slug,
        locale,
        keyword,
        outcome: 'no-metrics',
        collection: doc.collection,
      })
      continue
    }

    // No-clobber: read current primaryKeyword in THIS locale.
    const current = await payload.findByID({
      collection: doc.collection,
      id: doc.id,
      locale,
      depth: 0,
    })
    const existing = (current as { primaryKeyword?: unknown }).primaryKeyword
    const existingId =
      existing == null
        ? null
        : typeof existing === 'object'
          ? (existing as { id: string | number }).id
          : existing

    if (existingId != null && !FORCE) {
      results.push({
        key,
        slug,
        locale,
        keyword,
        outcome: 'skipped-existing',
        collection: doc.collection,
        metricsId: metrics.id,
      })
      continue
    }

    if (!DRY_RUN) {
      // Narrow the union to a literal so Payload's per-collection update
      // overload resolves cleanly.
      if (doc.collection === 'posts') {
        await payload.update({
          collection: 'posts',
          id: doc.id,
          data: { primaryKeyword: String(metrics.id) },
          locale,
        })
      } else {
        await payload.update({
          collection: 'pages',
          id: doc.id,
          data: { primaryKeyword: String(metrics.id) },
          locale,
        })
      }
    }
    results.push({
      key,
      slug,
      locale,
      keyword,
      outcome: existingId != null ? 'forced' : 'set',
      collection: doc.collection,
      metricsId: metrics.id,
    })
  }

  printConsole(results)
  if (REPORT) {
    await writeFile(REPORT_PATH, buildMarkdown(results), 'utf8')
    console.log(dim(`Report written to ${REPORT_PATH}\n`))
  }

  process.exit(0)
}

// ─── reporting ─────────────────────────────────────────────────────────────────

function tally(rows: RowResult[], locale: Locale) {
  const f = rows.filter((r) => r.locale === locale)
  return {
    set: f.filter((r) => r.outcome === 'set').length,
    forced: f.filter((r) => r.outcome === 'forced').length,
    skipped: f.filter((r) => r.outcome === 'skipped-existing').length,
    noDoc: f.filter((r) => r.outcome === 'no-doc').length,
    noMetrics: f.filter((r) => r.outcome === 'no-metrics').length,
    stub: f.filter((r) => r.outcome === 'stub-created').length,
  }
}

function printConsole(results: RowResult[]): void {
  console.log(bold('─── Summary by locale ─────────────────────────────────'))
  for (const locale of ['es', 'en'] as Locale[]) {
    const t = tally(results, locale)
    console.log(bold(`\n  Locale ${cyan(locale)}`))
    console.log(`    ${green('set            ')} ${t.set}`)
    if (t.forced) console.log(`    ${yellow('overwritten    ')} ${t.forced}`)
    if (t.stub) console.log(`    ${green('stub created   ')} ${t.stub}`)
    console.log(`    ${dim('skipped (have) ')} ${t.skipped}`)
    console.log(`    ${red('no page doc    ')} ${t.noDoc}`)
    console.log(`    ${yellow('no metrics doc ')} ${t.noMetrics}`)
  }

  const noDoc = results.filter((r) => r.outcome === 'no-doc')
  if (noDoc.length) {
    console.log(bold('\n─── Map entries with NO page doc ──────────────────────'))
    for (const r of noDoc) console.log(`  ${red('✖')} ${r.key} ${dim(`(${r.keyword})`)}`)
  }

  console.log('')
}

function mdEscape(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

function buildMarkdown(results: RowResult[]): string {
  const lines = [
    '# Keyword population report',
    '',
    `**Generated:** ${new Date().toISOString()}`,
    `**Mode:** ${DRY_RUN ? 'dry-run' : 'write'}${FORCE ? ' + force' : ''}`,
    '',
    '## Counts by locale',
    '',
    '| Locale | Set | Overwritten | Stubs | Skipped | No doc | No metrics |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ]
  for (const locale of ['es', 'en'] as Locale[]) {
    const t = tally(results, locale)
    lines.push(
      `| ${locale} | ${t.set} | ${t.forced} | ${t.stub} | ${t.skipped} | ${t.noDoc} | ${t.noMetrics} |`,
    )
  }
  lines.push('', '## All entries', '', '| Key | Locale | Keyword | Outcome | Collection |', '| --- | --- | --- | --- | --- |')
  for (const r of results) {
    lines.push(
      `| ${mdEscape(r.key)} | ${r.locale} | ${mdEscape(r.keyword)} | ${r.outcome} | ${r.collection ?? '—'} |`,
    )
  }
  return lines.join('\n') + '\n'
}

main().catch((err) => {
  console.error(red('Keyword population failed:'), err)
  process.exit(1)
})
