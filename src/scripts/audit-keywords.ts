/**
 * audit-keywords.ts
 *
 * Keyword coverage audit (AUDIT-01/02/03). Runs the shared core against the
 * live DB and reports:
 *   1. Every Post / Page / Category / User WITHOUT a primaryKeyword.
 *   2. Every keyworded page that FAILS >=1 applicable traffic-light check.
 *
 * Output: colored console summary + two lists, plus a timestamped, versionable
 * markdown report written to content/keyword-coverage-audit.md.
 *
 * Usage:
 *   pnpm audit:keywords
 *   pnpm audit:keywords --locale en
 *   npx tsx -r dotenv/config src/scripts/audit-keywords.ts --locale es
 *
 * Exit code is non-zero when coverage gaps exist (no-keyword + failing > 0) so
 * the command surfaces gaps in CI / manual runs.
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  runKeywordCoverageAudit,
  type CoverageRow,
  type KeywordCoverageReport,
} from '../utilities/seo/keywordCoverageAudit'

// ─── helpers ────────────────────────────────────────────────────────────────

const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`

const args = process.argv.slice(2)
const LOCALE = (() => {
  const idx = args.indexOf('--locale')
  const v = idx !== -1 ? args[idx + 1] : undefined
  return v === 'en' ? 'en' : 'es'
})() as 'es' | 'en'

const REPORT_PATH = join(process.cwd(), 'content', 'keyword-coverage-audit.md')

// ─── console output ───────────────────────────────────────────────────────────

function printConsole(report: KeywordCoverageReport): void {
  const { counts } = report

  console.log(bold('\n🔑  Keyword coverage audit — juan-tech.com'))
  console.log(dim(`Locale: ${LOCALE}  |  Generated: ${report.generatedAt}\n`))

  // WR-02: truncation must never be silent — surface it loudly before the data.
  if (report.truncated) {
    console.log(
      yellow(
        `⚠  TRUNCATED: one or more collections exceeded the per-collection cap ` +
          `(${report.truncatedCollections.join(', ')}). The numbers below UNDER-report ` +
          `coverage. Raise the cap or paginate to audit every document.`,
      ),
    )
    console.log('')
  }

  console.log(bold('─── Summary ───────────────────────────────────────────'))
  console.log(`  ${dim('Total pages       ')} ${counts.total}`)
  console.log(`  ${red('No keyword        ')} ${counts.noKeyword}`)
  console.log(`  ${yellow('Unresolved keyword')} ${counts.unresolvedKeyword}`)
  console.log(`  ${yellow('Failing checks    ')} ${counts.failing}`)
  console.log(`  ${green('Passing           ')} ${counts.passing}`)

  // List 1 — pages without a keyword.
  console.log(bold('\n─── Pages WITHOUT keyword ─────────────────────────────'))
  if (report.noKeyword.length === 0) {
    console.log(`  ${green('✔')} Every page has a primaryKeyword assigned.`)
  } else {
    for (const row of report.noKeyword) {
      console.log(`  ${red('✖')} [${row.collection}] ${row.label}`)
      if (row.url) console.log(`     ${dim(row.url)}`)
    }
  }

  // List 2 — keyworded pages failing >=1 applicable check.
  console.log(bold('\n─── Pages with keyword but FAILING checks ─────────────'))
  if (report.failing.length === 0) {
    console.log(`  ${green('✔')} Every keyworded page passes its applicable checks.`)
  } else {
    for (const row of report.failing) {
      const kw = row.keyword ? dim(`"${row.keyword}"`) : ''
      console.log(`  ${red('✖')} [${row.collection}] ${row.label} ${kw}`)
      if (row.url) console.log(`     ${dim(row.url)}`)
      console.log(`     ${red('failing:')} ${row.failingChecks.join(', ')}`)
      if (row.amberChecks.length > 0) {
        console.log(`     ${dim('warnings (amber): ' + row.amberChecks.join(', '))}`)
      }
    }
  }

  console.log('')
}

// ─── markdown report ──────────────────────────────────────────────────────────

function mdEscape(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

function noKeywordTable(rows: CoverageRow[]): string {
  if (rows.length === 0) return '_None — every page has a keyword._\n'
  const lines = ['| Collection | Page | Edit link |', '| --- | --- | --- |']
  for (const r of rows) {
    const link = r.url ? `[edit](${r.url})` : '—'
    lines.push(`| ${r.collection} | ${mdEscape(r.label)} | ${link} |`)
  }
  return lines.join('\n') + '\n'
}

function failingTable(rows: CoverageRow[]): string {
  if (rows.length === 0) return '_None — every keyworded page passes its applicable checks._\n'
  const lines = [
    '| Collection | Page | Keyword | Failing checks | Amber |',
    '| --- | --- | --- | --- | --- |',
  ]
  for (const r of rows) {
    const link = r.url ? `[${mdEscape(r.label)}](${r.url})` : mdEscape(r.label)
    const failing = r.failingChecks.join(', ') || '—'
    const amber = r.amberChecks.join(', ') || '—'
    lines.push(
      `| ${r.collection} | ${link} | ${mdEscape(r.keyword ?? '')} | ${failing} | ${amber} |`,
    )
  }
  return lines.join('\n') + '\n'
}

function buildMarkdown(report: KeywordCoverageReport): string {
  const { counts } = report
  const truncationNote = report.truncated
    ? [
        '> ⚠ **Truncated report.** These collections exceeded the per-collection ' +
          `query cap and are under-reported: ${report.truncatedCollections.join(', ')}.`,
        '',
      ]
    : []
  return [
    '# Keyword coverage audit',
    '',
    `**Generated:** ${report.generatedAt}`,
    `**Locale:** ${LOCALE}`,
    '',
    ...truncationNote,
    '## Counts',
    '',
    '| Metric | Count |',
    '| --- | --- |',
    `| Total pages | ${counts.total} |`,
    `| No keyword | ${counts.noKeyword} |`,
    `| Unresolved keyword | ${counts.unresolvedKeyword} |`,
    `| Failing checks | ${counts.failing} |`,
    `| Passing | ${counts.passing} |`,
    '',
    '## Pages without keyword',
    '',
    noKeywordTable(report.noKeyword),
    '## Pages with unresolved keyword relation',
    '',
    noKeywordTable(report.unresolvedKeyword),
    '## Pages failing checks',
    '',
    failingTable(report.failing),
  ].join('\n')
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const payload = await getPayload({ config: configPromise })

  const report = await runKeywordCoverageAudit(payload, { locale: LOCALE })

  printConsole(report)

  await writeFile(REPORT_PATH, buildMarkdown(report), 'utf8')
  console.log(dim(`Report written to ${REPORT_PATH}\n`))

  // WR-03: the CI exit code must reflect only actionable content gaps. Listings
  // (users / categories) rarely carry a keyword, so counting them would keep CI
  // permanently red. Count noKeyword + failing among posts and pages only.
  // Listings still appear in the report above and in the markdown.
  const isContent = (row: CoverageRow) => row.collection === 'posts' || row.collection === 'pages'
  const contentGaps =
    report.noKeyword.filter(isContent).length + report.failing.filter(isContent).length
  process.exit(contentGaps > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(red('Keyword audit failed:'), err)
  process.exit(1)
})
