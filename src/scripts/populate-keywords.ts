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

/**
 * Retry an async DB op on transient MongoDB transaction errors (write
 * conflicts / aborted transactions are safe to retry — Payload wraps each
 * operation in its own transaction). Up to `tries` attempts with backoff.
 */
async function withRetry<T>(label: string, fn: () => Promise<T>, tries = 4): Promise<T> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const msg = String((err as { message?: string })?.message ?? err)
      const labels = (err as { errorLabels?: string[] })?.errorLabels ?? []
      const transient =
        labels.includes('TransientTransactionError') ||
        /TransientTransactionError|NoSuchTransaction|WriteConflict|aborted/i.test(msg)
      if (!transient || attempt === tries) throw err
      console.log(dim(`  ↻ retry ${attempt}/${tries - 1} (${label}): transient tx error`))
      await new Promise((r) => setTimeout(r, 250 * attempt))
    }
  }
  throw lastErr
}

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
  outcome: 'set' | 'skipped-existing' | 'no-doc' | 'stub-created' | 'forced' | 'failed'
  error?: string
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
    try {
    const doc = await resolveDoc(payload, slug, locale)
    if (!doc) {
      results.push({ key, slug, locale, keyword, outcome: 'no-doc' })
      continue
    }

    // No-clobber: read current primaryKeyword in THIS locale BEFORE creating any
    // stub, so a skipped page never leaves an orphan keyword-metrics doc behind.
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
      })
      continue
    }

    // Match keyword-metrics by normalized keyword; create a needs-research stub
    // (RESEARCH-02) when no doc exists, then link it.
    let metrics = metricsByNorm.get(norm(keyword))
    let stubbed = false
    if (!metrics) {
      stubbed = true
      if (DRY_RUN) {
        results.push({
          key,
          slug,
          locale,
          keyword,
          outcome: 'stub-created',
          collection: doc.collection,
        })
        continue
      }
      // keyword/volume/difficulty/source are required on keyword-metrics; seed
      // placeholders and flag the doc for research. Reuse the existing `status`
      // field — no new fields added.
      const created = await withRetry(`create stub "${keyword}"`, () =>
        payload.create({
          collection: 'keyword-metrics',
          data: {
            keyword,
            status: 'needs-research',
            volume: 0,
            difficulty: 0,
            source: 'keywords_map (needs-research stub)',
          },
        }),
      )
      metrics = { id: created.id, keyword }
      metricsByNorm.set(norm(keyword), metrics)
    }

    if (!DRY_RUN) {
      // Narrow the union to a literal so Payload's per-collection update
      // overload resolves cleanly.
      const metricsId = String(metrics.id)
      if (doc.collection === 'posts') {
        await withRetry(`set posts/${slug} [${locale}]`, () =>
          payload.update({
            collection: 'posts',
            id: doc.id,
            data: { primaryKeyword: metricsId },
            locale,
            // Running outside Next: skip the revalidatePath afterChange hook
            // (no static-generation store in a plain script).
            context: { disableRevalidate: true },
          }),
        )
      } else {
        await withRetry(`set pages/${slug} [${locale}]`, () =>
          payload.update({
            collection: 'pages',
            id: doc.id,
            data: { primaryKeyword: metricsId },
            locale,
            context: { disableRevalidate: true },
          }),
        )
      }
    }
    results.push({
      key,
      slug,
      locale,
      keyword,
      outcome: stubbed ? 'stub-created' : existingId != null ? 'forced' : 'set',
      collection: doc.collection,
      metricsId: metrics.id,
    })
    } catch (err) {
      const msg = String((err as { message?: string })?.message ?? err)
      console.log(red(`  ✖ failed ${key}: ${msg.split('\n')[0]}`))
      results.push({ key, slug, locale, keyword, outcome: 'failed', error: msg.split('\n')[0] })
    }
  }

  // Mark existing metrics docs lacking volume / difficulty / intent as
  // needs-research so the Phase 23 audit (AUDIT-01/02) lists them. Idempotent:
  // never re-touches a doc already flagged needs-research.
  const isEmpty = (v: unknown) => v === null || v === undefined || v === ''
  let marked = 0
  {
    let page = 1
    for (;;) {
      const res = await payload.find({
        collection: 'keyword-metrics',
        limit: 200,
        page,
        depth: 0,
      })
      for (const d of res.docs) {
        const needs = isEmpty(d.volume) || isEmpty(d.difficulty) || isEmpty(d.intent)
        if (needs && d.status !== 'needs-research') {
          if (!DRY_RUN) {
            try {
              await withRetry(`mark metrics ${d.id}`, () =>
                payload.update({
                  collection: 'keyword-metrics',
                  id: d.id,
                  data: { status: 'needs-research' },
                }),
              )
              marked += 1
            } catch (err) {
              const msg = String((err as { message?: string })?.message ?? err)
              console.log(red(`  ✖ failed to mark ${d.keyword}: ${msg.split('\n')[0]}`))
            }
          } else {
            marked += 1
          }
        }
      }
      if (!res.hasNextPage) break
      page += 1
    }
  }

  printConsole(results, marked)
  if (REPORT) {
    await writeFile(REPORT_PATH, buildMarkdown(results, marked), 'utf8')
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
    stub: f.filter((r) => r.outcome === 'stub-created').length,
    failed: f.filter((r) => r.outcome === 'failed').length,
  }
}

function printConsole(results: RowResult[], marked: number): void {
  console.log(bold('─── Summary by locale ─────────────────────────────────'))
  for (const locale of ['es', 'en'] as Locale[]) {
    const t = tally(results, locale)
    console.log(bold(`\n  Locale ${cyan(locale)}`))
    console.log(`    ${green('set            ')} ${t.set}`)
    if (t.forced) console.log(`    ${yellow('overwritten    ')} ${t.forced}`)
    if (t.stub) console.log(`    ${green('stub created   ')} ${t.stub}`)
    console.log(`    ${dim('skipped (have) ')} ${t.skipped}`)
    console.log(`    ${red('no page doc    ')} ${t.noDoc}`)
    if (t.failed) console.log(`    ${red('failed         ')} ${t.failed}`)
  }

  console.log(
    bold(`\n  ${yellow('marked needs-research (missing volume/difficulty/intent): ')}${marked}`),
  )

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

function buildMarkdown(results: RowResult[], marked: number): string {
  const lines = [
    '# Keyword population report',
    '',
    `**Generated:** ${new Date().toISOString()}`,
    `**Mode:** ${DRY_RUN ? 'dry-run' : 'write'}${FORCE ? ' + force' : ''}`,
    `**Marked needs-research (missing volume/difficulty/intent):** ${marked}`,
    '',
    '## Counts by locale',
    '',
    '| Locale | Set | Overwritten | Stubs | Skipped | No doc | Failed |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ]
  for (const locale of ['es', 'en'] as Locale[]) {
    const t = tally(results, locale)
    lines.push(
      `| ${locale} | ${t.set} | ${t.forced} | ${t.stub} | ${t.skipped} | ${t.noDoc} | ${t.failed} |`,
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
