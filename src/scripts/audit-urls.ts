/**
 * audit-urls.ts
 *
 * Audits the site for URL issues:
 *   1. Blog posts with MongoDB ObjectIDs as category slugs
 *   2. Missing critical pages (contact, terms, privacy, blog, home, sitemap)
 *   3. HTTP 4xx/3xx responses on sampled URLs
 *   4. Media docs missing cloudinaryUrl (will produce 400 on next/image in prod)
 *
 * Usage:
 *   npx tsx -r dotenv/config src/scripts/audit-urls.ts
 *   npx tsx -r dotenv/config src/scripts/audit-urls.ts --check-live   # hit each URL (slow)
 *   npx tsx -r dotenv/config src/scripts/audit-urls.ts --locale es
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const MONGO_ID_RE = /^[0-9a-f]{24}$/i
const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://juan-tech.com'
const CONTENT_DIR = join(process.cwd(), 'content', 'posts')

const args = process.argv.slice(2)
const CHECK_LIVE = args.includes('--check-live')
const LOCALE = (() => {
  const idx = args.indexOf('--locale')
  return idx !== -1 ? args[idx + 1] : undefined
})() as 'en' | 'es' | undefined

// ─── helpers ──────────────────────────────────────────────────────────────────

const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`

async function httpStatus(url: string): Promise<number> {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(10_000) })
    return res.status
  } catch {
    return 0
  }
}

function isMongoId(s: string): boolean {
  return MONGO_ID_RE.test(s)
}

// ─── issue types ──────────────────────────────────────────────────────────────

interface Issue {
  severity: 'error' | 'warning' | 'info'
  type: string
  description: string
  url?: string
  fix?: string
}

const issues: Issue[] = []

function addIssue(issue: Issue) {
  issues.push(issue)
  const icon = issue.severity === 'error' ? red('✖') : issue.severity === 'warning' ? yellow('⚠') : dim('ℹ')
  console.log(`  ${icon} [${issue.type}] ${issue.description}`)
  if (issue.url) console.log(`     ${dim('URL:')} ${issue.url}`)
  if (issue.fix) console.log(`     ${dim('Fix:')} ${issue.fix}`)
}

// ─── audit sections ───────────────────────────────────────────────────────────

async function auditBlogPostUrls(payload: Awaited<ReturnType<typeof getPayload>>) {
  console.log(bold('\n🔗  Blog post URL audit'))

  const locales: Array<'en' | 'es'> = LOCALE ? [LOCALE] : ['es', 'en']
  let checked = 0
  let idBased = 0

  for (const locale of locales) {
    const res = await payload.find({
      collection: 'posts',
      limit: 500,
      depth: 1,
      locale,
      select: { slug: true, title: true, categories: true },
    })

    for (const post of res.docs) {
      checked++
      const cats = post.categories || []
      if (cats.length === 0) {
        addIssue({
          severity: 'warning',
          type: 'no-category',
          description: `Post "${post.title}" (${post.slug}) has no category → will use /blog/general/`,
          url: `${SITE_URL}${locale === 'en' ? '/en' : ''}/blog/general/${post.slug}`,
          fix: 'Assign at least one category in Payload CMS',
        })
        continue
      }

      const firstCat = cats[0]
      if (typeof firstCat === 'string' && isMongoId(firstCat)) {
        idBased++
        addIssue({
          severity: 'error',
          type: 'mongo-id-category',
          description: `Post "${post.title}" (${post.slug}) category is unpopulated ObjectID "${firstCat}"`,
          url: `${SITE_URL}${locale === 'en' ? '/en' : ''}/blog/${firstCat}/${post.slug}`,
          fix: 'Ensure categories are populated at depth ≥ 1. The blog post page now auto-redirects, but source links should use getPostUrl().',
        })
      } else if (
        typeof firstCat === 'object' &&
        firstCat !== null &&
        firstCat.slug &&
        isMongoId(firstCat.slug)
      ) {
        idBased++
        addIssue({
          severity: 'error',
          type: 'mongo-id-slug',
          description: `Category "${firstCat.id}" used by "${post.slug}" has an ObjectID as its slug`,
          fix: 'Set a proper slug on this category in Payload CMS',
        })
      }
    }
  }

  console.log(dim(`  Checked ${checked} post(s) across ${locales.length} locale(s). ${idBased} ObjectID category issues found.`))
}

async function auditCriticalPages(payload: Awaited<ReturnType<typeof getPayload>>) {
  console.log(bold('\n📄  Critical pages audit'))

  const requiredSlugs = ['contact', 'terms', 'privacy']

  for (const slug of requiredSlugs) {
    const res = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    if (res.docs.length === 0) {
      addIssue({
        severity: 'info',
        type: 'no-cms-page',
        description: `No Payload CMS page with slug "${slug}" — using static Next.js fallback page`,
        url: `${SITE_URL}/${slug}`,
        fix: 'Optionally create a page in Payload CMS with slug "' + slug + '" to manage content dynamically',
      })
    } else {
      console.log(`  ${green('✔')} CMS page exists: /${slug}`)
    }
  }

  // Check required categories
  const requiredCategories = ['general']
  for (const catSlug of requiredCategories) {
    const res = await payload.find({
      collection: 'categories',
      where: { slug: { equals: catSlug } },
      limit: 1,
    })
    if (res.docs.length === 0) {
      addIssue({
        severity: 'error',
        type: 'missing-category',
        description: `Category with slug "${catSlug}" does not exist — posts without category produce 404 at /blog/general`,
        fix: `Create a category with slug "${catSlug}" in Payload CMS → /admin/collections/categories`,
      })
    } else {
      console.log(`  ${green('✔')} Category exists: ${catSlug}`)
    }
  }
}

async function auditMediaCloudinary(payload: Awaited<ReturnType<typeof getPayload>>) {
  console.log(bold('\n🖼️   Media cloudinaryUrl audit'))

  const res = await payload.find({
    collection: 'media',
    limit: 200,
    depth: 0,
  })

  let missing = 0
  for (const doc of res.docs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const media = doc as any
    if (!media.cloudinaryUrl && media.url?.startsWith('/api/media/file/')) {
      missing++
      addIssue({
        severity: 'warning',
        type: 'local-media-no-cloudinary',
        description: `Media "${media.filename || media.id}" has no cloudinaryUrl — will produce HTTP 400 via next/image in production`,
        url: media.url,
        fix: 'Re-upload this file through the Payload admin to sync it with Cloudinary',
      })
    }
  }

  if (missing === 0) {
    console.log(`  ${green('✔')} All checked media docs have cloudinaryUrl`)
  } else {
    console.log(dim(`  ${missing} media doc(s) missing cloudinaryUrl`))
  }
}

async function auditLiveUrls() {
  console.log(bold('\n🌐  Live HTTP status audit'))
  const localePrefix = LOCALE === 'en' ? '/en' : ''

  const criticalPaths = [
    '/',
    '/blog',
    '/contact',
    '/terms',
    '/privacy',
    '/sitemap',
    `${localePrefix}/blog`,
    `${localePrefix}/contact`,
    `${localePrefix}/terms`,
    `${localePrefix}/privacy`,
  ].filter((v, i, a) => a.indexOf(v) === i) // deduplicate

  for (const path of criticalPaths) {
    const url = `${SITE_URL}${path}`
    const status = await httpStatus(url)
    if (status === 0) {
      addIssue({ severity: 'warning', type: 'unreachable', description: `Could not reach ${url}`, url })
    } else if (status >= 400) {
      addIssue({ severity: 'error', type: `http-${status}`, description: `HTTP ${status} on ${url}`, url,
        fix: status === 404 ? 'Page does not exist — create it or set up a redirect' : `Investigate ${status} error`,
      })
    } else if (status >= 300) {
      addIssue({ severity: 'warning', type: `http-${status}`, description: `HTTP ${status} (redirect) on ${url}`, url,
        fix: 'Check if a CMS redirect entry is overriding this path',
      })
    } else {
      console.log(`  ${green('✔')} ${status} ${path}`)
    }
  }
}

async function collectMdFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectMdFiles(full)))
    } else if (entry.name.endsWith('.md')) {
      files.push(full)
    }
  }
  return files
}

async function auditMarkdownLinks() {
  console.log(bold('\n📝  Markdown internal-link audit'))

  let files: string[]
  try {
    files = await collectMdFiles(CONTENT_DIR)
  } catch {
    console.log(dim(`  Skipping — content dir not found: ${CONTENT_DIR}`))
    return
  }

  const OLD_POSTS_RE = /\]\(\/posts\//g
  let totalMatches = 0

  for (const file of files) {
    const content = await readFile(file, 'utf8')
    const matches = content.match(OLD_POSTS_RE)
    if (matches) {
      totalMatches += matches.length
      const relPath = file.replace(process.cwd() + '/', '')
      addIssue({
        severity: 'warning',
        type: 'old-posts-link',
        description: `${relPath} contains ${matches.length} link(s) using old /posts/ format`,
        fix: 'Replace /posts/<path> with /blog/<path>. The /posts/* redirect now handles live traffic, but update the source for clean content.',
      })
    }
  }

  if (totalMatches === 0) {
    console.log(`  ${green('✔')} No old /posts/ links found in ${files.length} Markdown file(s)`)
  } else {
    console.log(dim(`  ${totalMatches} old /posts/ link(s) across ${files.length} file(s)`))
  }
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(bold('🔍  URL Audit — juan-tech.com'))
  console.log(dim(`Site: ${SITE_URL}  |  Live checks: ${CHECK_LIVE ? 'ON' : 'OFF'}  |  Locale filter: ${LOCALE || 'all'}\n`))

  const payload = await getPayload({ config: configPromise })

  await auditBlogPostUrls(payload)
  await auditCriticalPages(payload)
  await auditMediaCloudinary(payload)
  await auditMarkdownLinks()
  if (CHECK_LIVE) await auditLiveUrls()

  // ── Summary ──────────────────────────────────────────────────────────────────
  const errors = issues.filter(i => i.severity === 'error')
  const warnings = issues.filter(i => i.severity === 'warning')
  const infos = issues.filter(i => i.severity === 'info')

  console.log(bold('\n─── Summary ───────────────────────────────────────────'))
  console.log(`  ${red('Errors  ')} ${errors.length}`)
  console.log(`  ${yellow('Warnings')} ${warnings.length}`)
  console.log(`  ${dim('Info    ')} ${infos.length}`)

  if (errors.length > 0) {
    console.log(red('\nErrors to fix:'))
    errors.forEach(e => console.log(`  • [${e.type}] ${e.description}`))
  }

  console.log('')
  process.exit(errors.length > 0 ? 1 : 0)
}

main().catch(err => {
  console.error(red('Audit failed:'), err)
  process.exit(1)
})
