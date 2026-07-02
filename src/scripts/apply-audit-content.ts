/**
 * Apply audit-jul2026 content fixes directly to the Payload DB (Local API):
 *   #105 — translate the home FAQ block to English (en locale).
 *   #106 — correct stale URLs in the `llm` global (both locales). Its
 *          fullContent is already structured Markdown; the "no structure"
 *          finding was the broken /llms.txt route (#93), not the content.
 *
 * Backs up the current values to .planning/research/audit-jul2026/ before writing.
 * Run: npx tsx -r dotenv/config src/scripts/apply-audit-content.ts
 */
import { getPayload } from 'payload'
import * as fs from 'fs'
import config from '../payload.config'

// --- #105 English FAQ (title, questions, answer text nodes in document order) ---
const FAQ_TITLE_EN = 'Frequently Asked Questions'
const FAQ_QUESTIONS_EN = [
  'What is the difference between traditional SEO and your Technical SEO consulting?',
  'Do you only deliver the audit, or do you also implement the code changes?',
  'Which tech stack and platforms do you specialize in?',
  'How do we measure the success of the optimizations?',
  'What is the process to start working with you?',
]
const FAQ_ANSWERS_EN: string[][] = [
  [
    'Traditional SEO focuses on content writing and link building. My consulting works on the web infrastructure itself. I optimize the ',
    'Crawl Budget',
    ', the rendering patterns, and the ',
    'information architecture',
    ' to clear the bottlenecks that keep your site from being indexed properly.',
  ],
  [
    'I cover both stages. I find the infrastructure weaknesses and design the technical solution. I can implement the improvements directly in the codebase, or document the tasks to guide your development team through the work.',
  ],
  [
    'I work mostly with modern architectures and ',
    'Headless',
    ' systems. My technical focus covers frameworks like ',
    'Next.js',
    ' and ',
    'React',
    ', content managers like ',
    'PayloadCMS',
    ', and e-commerce platforms like ',
    'Shopify',
    ' and WordPress.',
  ],
  [
    'We track progress with objective data. We monitor the improvement in the ',
    'Core Web Vitals',
    ' (LCP, INP, CLS) to gauge performance. On the search side, we track error fixes in Google Search Console and the rise in the share of valid indexed URLs.',
  ],
  [
    'I recommend starting with an initial Technical SEO audit. That lets me assess the current health of your infrastructure, spot rendering blockers, and set a prioritized roadmap before committing development resources.',
  ],
]

// --- #106 URL corrections for the llm global ---
// The llm content uses the bare cluster paths (verified: no /blog/ prefix present),
// so plain replacements are safe and unambiguous.
const LLM_URL_FIXES: Array<[RegExp, string]> = [
  [/\/author\/juan-carlos-angulo/g, '/authors/juan-carlos-angulo'],
  [/\/tech-seo\//g, '/blog/tech-seo/'],
  [/\/cs-fundamentals\//g, '/blog/cs-fundamentals/'],
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function replaceTextNodesInOrder(root: any, replacements: string[]): number {
  let i = 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walk = (n: any) => {
    if (n && typeof n.text === 'string') {
      if (i < replacements.length) n.text = replacements[i]
      i++
    }
    ;(n?.children || []).forEach(walk)
  }
  walk(root)
  return i
}

function fixLlmUrls(s: string | null | undefined): string | null | undefined {
  if (!s) return s
  let out = s
  for (const [re, rep] of LLM_URL_FIXES) out = out.replace(re, rep)
  return out
}

async function main() {
  const payload = await getPayload({ config })
  const backupDir = '.planning/research/audit-jul2026'

  // --- Backup ---
  const backup = {
    homeEn: await payload.findGlobal({ slug: 'home', locale: 'en', depth: 0 }),
    llmEs: await payload.findGlobal({ slug: 'llm', locale: 'es', depth: 0 }),
    llmEn: await payload.findGlobal({ slug: 'llm', locale: 'en', depth: 0 }),
  }
  fs.writeFileSync(`${backupDir}/db-backup-pre-content-fix.json`, JSON.stringify(backup, null, 2))
  console.log('✔ backup written to', `${backupDir}/db-backup-pre-content-fix.json`)

  // --- #105 home FAQ (en) ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeEn: any = backup.homeEn
  const layout: any[] = homeEn.layout || []
  const faq = layout.find((b) => b?.blockType === 'faq')
  if (!faq) throw new Error('FAQ block not found in home layout')
  faq.title = FAQ_TITLE_EN
  faq.faqs.forEach((f: { question: string; answer: { root: unknown } }, idx: number) => {
    if (FAQ_QUESTIONS_EN[idx]) f.question = FAQ_QUESTIONS_EN[idx]
    if (FAQ_ANSWERS_EN[idx]) {
      const used = replaceTextNodesInOrder(f.answer.root, FAQ_ANSWERS_EN[idx])
      if (used !== FAQ_ANSWERS_EN[idx].length) {
        console.warn(`  ⚠ FAQ #${idx}: ${used} text nodes but ${FAQ_ANSWERS_EN[idx].length} translations`)
      }
    }
  })
  await payload.updateGlobal({ slug: 'home', locale: 'en', data: { layout }, context: { disableRevalidate: true } })
  console.log('✔ #105 home FAQ (en) translated')

  // --- #106 llm URLs (es + en) ---
  for (const locale of ['es', 'en'] as const) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const l: any = locale === 'es' ? backup.llmEs : backup.llmEn
    await payload.updateGlobal({
      slug: 'llm',
      locale,
      data: {
        summary: fixLlmUrls(l.summary) ?? undefined,
        fullContent: fixLlmUrls(l.fullContent) ?? undefined,
      },
      context: { disableRevalidate: true },
    })
    console.log(`✔ #106 llm URLs fixed (${locale})`)
  }

  console.log('\nDone. Revalidate llms.txt/home caches or redeploy to reflect changes.')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
