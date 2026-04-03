#!/usr/bin/env node
/**
 * Internal Linking Automation Script
 *
 * Automatically generates internal links between blog posts based on:
 *  1. Topic cluster rules  — structural satellite↔pillar links are always enforced
 *  2. Keyword matching     — natural keyword mentions are linked within the same locale & category
 */

import * as fs from 'fs'
import * as path from 'path'
import matter from 'gray-matter'
import { KeywordExtractor } from './internal-linking/KeywordExtractor'
import { ContentScanner } from './internal-linking/ContentScanner'
import { LinkInjector } from './internal-linking/LinkInjector'
import { FrontmatterTagger } from './internal-linking/FrontmatterTagger'
import {
  buildClusterMap,
  getMissingClusterLinks,
  getClusterSummaries,
} from './internal-linking/topicCluster'
import type { LinkingConfig, LinkOpportunity } from './internal-linking/types'
import enquirer from 'enquirer'

interface EnquirerConfirmClass {
  new(options: { name: string; message: string }): { run(): Promise<boolean> }
}

const { Confirm } = enquirer as unknown as { Confirm: EnquirerConfirmClass }

// ANSI Colors
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
}

// Parse command line arguments
interface CliConfig extends LinkingConfig {
  help: boolean
  classify: boolean
  clusterOnly: boolean
  yes: boolean
  locale?: 'en' | 'es'
}

function parseArgs(): CliConfig {
  const args = process.argv.slice(2)
  const config: CliConfig = {
    maxLinksPerKeyword: 3,
    minWordLength: 3,
    excludePatterns: [/^```/, /^#{1,6}\s/, /^---$/, /^\s*[-*+]\s*$/],
    dryRun: false,
    verbose: false,
    help: false,
    classify: false,
    clusterOnly: false,
    yes: false,
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dry-run':     config.dryRun = true;                         break
      case '--yes':         config.yes = true;                            break
      case '--category':    config.category = args[++i];                  break
      case '--locale':      config.locale = args[++i] as 'en' | 'es';    break
      case '--max-links':   config.maxLinksPerKeyword = parseInt(args[++i], 10); break
      case '--verbose':     config.verbose = true;                        break
      case '--classify':    config.classify = true;                       break
      case '--cluster-only':config.clusterOnly = true;                    break
      case '--help': case '-h': config.help = true;                       break
      default:
        console.warn(`${c.yellow}⚠️ Unknown option: ${args[i]}${c.reset}`)
    }
  }
  return config
}

function showHelp(): void {
  console.log(`
${c.bright}${c.cyan}🔗 Internal Linking Manager (Topic Cluster Edition)${c.reset}

${c.bright}Usage:${c.reset}
  npx tsx src/scripts/build-internal-links.ts [options]

${c.bright}Options:${c.reset}
  --dry-run              Preview changes without modifying files
  --classify             Tag unclassified posts with contentRole in frontmatter
  --cluster-only         Only enforce pillar↔satellite links (skip keyword scan)
  --category <name>      Process only a specific category (e.g., tech-seo)
  --locale <en|es>       Process only posts in this locale
  --max-links <n>        Max keyword links per post (default: 3)
  --include-test         Include posts in the 'test' directory
  --verbose              Show detailed logs
  --help, -h             Show this help

${c.bright}Topic Cluster Model:${c.reset}
  Pillar page:   3,000+ words, broad keyword, hub for a topic.
                 Frontmatter → contentRole: pillar
  Satellite:     Deep-dive on a long-tail keyword, links back to pillar.
                 Frontmatter → contentRole: satellite
                              pillarSlug: <pillar-slug>

${c.bright}Examples:${c.reset}
  # Preview cluster health
  npx tsx src/scripts/build-internal-links.ts --dry-run

  # Tag unclassified posts
  npx tsx src/scripts/build-internal-links.ts --classify --dry-run

  # Enforce structural cluster links only
  npx tsx src/scripts/build-internal-links.ts --cluster-only

  # Full run for a single locale
  npx tsx src/scripts/build-internal-links.ts --locale es
`)
}

function printClusterHealth(
  clusters: ReturnType<typeof buildClusterMap>,
  readFile: (p: string) => string,
): void {
  const summaries = getClusterSummaries(clusters, readFile)
  if (summaries.length === 0) {
    console.log(`${c.yellow}  No topic clusters found. Tag posts with contentRole: pillar to get started.${c.reset}`)
    return
  }

  for (const s of summaries) {
    const icon =
      s.health === 'healthy' ? `${c.green}✅` :
      s.health === 'no-satellites' ? `${c.yellow}⚠️ ` :
      `${c.red}❌`

    console.log(
      `\n  ${icon} [${s.locale.toUpperCase()}] ${c.bright}${s.pillarTitle}${c.reset}` +
      `  ${c.dim}(${s.satelliteCount} satellites)${c.reset}`,
    )

    if (s.health === 'missing-links') {
      for (const ml of s.missingLinks) {
        const arrow = ml.linkType === 'satellite-to-pillar' ? '↑ pillar' : '↓ satellite'
        console.log(
          `      ${c.red}→ ${ml.source.slug} missing link to ${ml.target.slug} [${arrow}]${c.reset}`,
        )
      }
    }
  }
  console.log(c.reset)
}

/**
 * Main TUI Execution
 */
async function main(): Promise<void> {
  const config = parseArgs()

  if (config.help) {
    showHelp()
    return
  }

  console.clear()
  console.log(`${c.bright}${c.cyan}🔗 Internal Linking Manager${c.reset}\n`)

  const contentDir = path.resolve(process.cwd(), 'content')
  const postsDir = path.join(contentDir, 'posts')

  // ── Step 0: Classify (optional) ──────────────────────────────────────────
  if (config.classify) {
    console.log(`${c.blue}🏷️  Classifying posts with contentRole…${c.reset}`)
    const tagger = new FrontmatterTagger()
    if (!config.dryRun) {
      tagger.tagDirectory(postsDir)
      console.log(`${c.green}✅ Classification complete.${c.reset}\n`)
    } else {
      console.log(`${c.yellow}💡 Dry run — no files written.${c.reset}\n`)
    }
  }

  // ── Step 1: Load posts & build keyword index ──────────────────────────────
  process.stdout.write(`${c.blue}📚 Loading posts and building index…${c.reset}`)
  const extractor = new KeywordExtractor(contentDir)
  const allPosts = await extractor.loadPosts()
  let posts = allPosts

  // Filter by category if requested
  if (config.category) {
    posts = posts.filter(p => p.category === config.category)
  }

  // Filter by locale if requested
  if (config.locale) {
    posts = posts.filter(p => (p.idioma ?? 'es') === config.locale)
  }

  const keywordIndex = extractor.buildIndex(posts)
  process.stdout.write(
    `\r${c.green}✅ Loaded ${allPosts.length} posts (processing ${posts.length}), indexed ${keywordIndex.size} keywords.    \n\n${c.reset}`,
  )

  // ── Step 1.5: Strict URL Normalization ──────────────────────────────────
  const injector = new LinkInjector()
  process.stdout.write(`${c.blue}🛡️  Normalizing internal links to absolute URLs…${c.reset}`)
  // We use allPosts to build the full URL map, but we only modify files in the current 'posts' subset
  const upgradeCount = injector.upgradeRelativeLinks(allPosts, posts, config.dryRun)
  process.stdout.write(
    `\r${c.green}✅ Normalized ${upgradeCount} posts with absolute URLs.          \n\n${c.reset}`,
  )

  // ── Step 2: Topic cluster health ─────────────────────────────────────────
  const clusterMap = buildClusterMap(posts)
  const readFileSafe = (p: string) => {
    try { return fs.readFileSync(p, 'utf-8') } catch { return '' }
  }

  console.log(`${c.bright}📐 Topic Cluster Health:${c.reset}`)
  printClusterHealth(clusterMap, readFileSafe)

  const missingClusterLinks = getMissingClusterLinks(clusterMap, readFileSafe)

  // ── Step 2.5: Link Density Report ────────────────────────────────────────
  console.log(`${c.bright}📊 Link Density Report:${c.reset}`)
  const orphans: string[] = []
  const lowDensity: string[] = []
  
  for (const post of posts) {
    const content = readFileSafe(post.filePath)
    const { content: body } = matter(content)
    
    // Extract all markdown links
    const allLinks = body.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []
    
    // Filter only internal links (those starting with / or containing juan-tech.com)
    const internalLinks = allLinks.filter(link => {
      const url = link.match(/\(([^)]+)\)/)?.[1] || ''
      return url.startsWith('/') || url.includes('juan-tech.com')
    })

    if (internalLinks.length === 0) {
      orphans.push(post.slug)
    } else if (internalLinks.length < 2) {
      lowDensity.push(`${post.slug} (${internalLinks.length} link)`)
    }
  }

  if (orphans.length > 0) {
    console.log(`${c.red}  ❌ Found ${orphans.length} posts with ZERO internal links (Orphans):${c.reset}`)
    orphans.forEach(slug => console.log(`      - ${slug}`))
    
    // KILLER FEATURE: Prepare automatic lateral links for orphans
    for (const slug of orphans) {
      const post = posts.find(p => p.slug === slug);
      if (post && post.contentRole === 'satellite' && post.pillarSlug) {
        // Find other satellites in same cluster to suggest a 'See Also' link
        const siblings = posts.filter(p => 
          p.pillarSlug === post.pillarSlug && 
          p.slug !== post.slug && 
          p.idioma === post.idioma
        );
        
        if (siblings.length > 0) {
          const target = siblings[Math.floor(Math.random() * siblings.length)];
          missingClusterLinks.push({
            source: post,
            target: target,
            linkType: 'satellite-to-pillar' // Reusing logic to trigger 'See Also' injection
          });
          console.log(`${c.cyan}      💡 Suggested lateral link: ${post.slug} → ${target.slug}${c.reset}`);
        }
      }
    }
  }
  
  if (lowDensity.length > 0) {
    console.log(`${c.yellow}  ⚠️  Found ${lowDensity.length} posts with low internal link density (< 2 links):${c.reset}`)
    lowDensity.forEach(item => console.log(`      - ${item}`))
  }

  if (orphans.length === 0 && lowDensity.length === 0) {
    console.log(`${c.green}  ✅ All posts have healthy internal link density.${c.reset}`)
  }
  console.log()

  // ── Step 3: Keyword-based scan (skipped with --cluster-only) ─────────────
  let opportunitiesMap = new Map<string, LinkOpportunity[]>()

  if (!config.clusterOnly) {
    process.stdout.write(`${c.blue}🔍 Scanning posts for keyword link opportunities…${c.reset}`)
    const scanner = new ContentScanner(keywordIndex, {
      ...config,
      semantic: {
        enabled: true,
        provider: 'auto',
        model: 'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
      },
    })
    opportunitiesMap = await scanner.scanAllPosts(posts)
    process.stdout.write(
      `\r${c.green}✅ Scan complete! Found opportunities in ${opportunitiesMap.size} posts.${c.reset}\n\n`,
    )

    if (opportunitiesMap.size > 0) {
      console.log(`${c.bright}Found Keyword Opportunities:${c.reset}`)
      let total = 0
      for (const [slug, ops] of opportunitiesMap.entries()) {
        total += ops.length
        console.log(`\n${c.magenta}📄 ${slug}${c.reset} ${c.dim}(${ops.length} links)${c.reset}`)
        ops.forEach(op => {
          console.log(
            `  ${c.cyan}→${c.reset} "${c.bright}${op.keyword}${c.reset}" 🔗 ${c.blue}${op.targetPost.url}${c.reset} ${c.dim}(line ${op.lineNumber})${c.reset}`,
          )
        })
      }
      console.log(`\n${c.bright}Summary: ${total} keyword opportunities across ${opportunitiesMap.size} posts.${c.reset}\n`)
    } else {
      console.log(`${c.yellow}No new keyword link opportunities found.${c.reset}\n`)
    }
  }

  // ── Step 4: Content gaps ──────────────────────────────────────────────────
  if (!config.clusterOnly) {
    const scanner = new ContentScanner(keywordIndex, { ...config, semantic: { enabled: false } })
    const contentGaps = scanner.findContentGaps(posts)
    const gaps = Array.from(contentGaps.entries())
      .filter(([, d]) => d.count >= 3)
      .map(([keyword, d]) => ({
        keyword,
        mentionCount: d.count,
        mentionedIn: Array.from(d.sources),
        category: d.category,
      }))

    if (gaps.length > 0) {
      console.log(
        `${c.yellow}💡 ${gaps.length} content gaps identified (keywords mentioned ≥ 3× with no dedicated post).${c.reset}`,
      )
      if (config.verbose) {
        gaps.forEach(g => console.log(`   - "${g.keyword}" (${g.mentionCount} mentions)`))
      }
      console.log()
    }
  }

  // ── Step 5: Dry run exit ──────────────────────────────────────────────────
  if (config.dryRun) {
    if (missingClusterLinks.length > 0) {
      console.log(
        `${c.yellow}💡 ${missingClusterLinks.length} structural cluster link(s) would be injected.${c.reset}`,
      )
    }
    console.log(`${c.yellow}💡 Dry run — no files modified.${c.reset}`)
    return
  }

  // ── Step 6: Confirm & apply ───────────────────────────────────────────────
  const hasWork =
    opportunitiesMap.size > 0 || missingClusterLinks.length > 0

  if (!hasWork) {
    console.log(`${c.green}✅ Everything is up to date. Nothing to do.${c.reset}`)
    return
  }

  let confirmed = config.yes

  if (!confirmed) {
    const prompt = new Confirm({
      name: 'confirm',
      message: 'Apply these links to your posts?',
    })
    confirmed = await prompt.run()
  }

  if (!confirmed) {
    console.log(`\n${c.yellow}Operation cancelled.${c.reset}`)
    return
  }

  // Apply structural cluster links first (highest priority)
  if (missingClusterLinks.length > 0) {
    console.log(`\n${c.blue}🔗 Enforcing ${missingClusterLinks.length} structural cluster link(s)…${c.reset}`)
    const clusterModified = injector.applyClusterLinks(missingClusterLinks, false)
    console.log(`${c.green}✅ ${clusterModified} file(s) updated with cluster links.${c.reset}`)
  }

  // Apply keyword-based links
  if (opportunitiesMap.size > 0) {
    console.log(`\n${c.blue}✍️  Applying keyword links…${c.reset}`)
    const result = injector.applyLinks(opportunitiesMap, false)
    console.log(
      `${c.green}✅ Added ${result.linksAdded} keyword links across ${result.modifiedPosts.length} files.${c.reset}`,
    )
    if (result.errors.length > 0) {
      console.log(`\n${c.red}❌ ${result.errors.length} error(s):${c.reset}`)
      result.errors.forEach(e => console.log(`   - ${e.post}: ${e.error}`))
    }
  }

  // Content gap recommendations
  if (!config.clusterOnly) {
    const scanner = new ContentScanner(keywordIndex, { ...config, semantic: { enabled: false } })
    const contentGaps = scanner.findContentGaps(posts)
    const gaps = Array.from(contentGaps.entries())
      .filter(([, d]) => d.count >= 3)
      .map(([keyword, d]) => ({
        keyword,
        mentionCount: d.count,
        mentionedIn: Array.from(d.sources),
        category: d.category,
      }))

    if (gaps.length > 0) {
      const { RecommendationTracker } = await import('./internal-linking/RecommendationTracker')
      const tracker = new RecommendationTracker(contentDir)
      tracker.loadExistingKeywords()
      const added = tracker.addRecommendations(gaps, false)
      if (added > 0) {
        console.log(`${c.green}✅ Added ${added} recommendations to keywords.md${c.reset}`)
      }
    }
  }

  console.log()
}

// Run
main().catch(error => {
  console.error(`\n${c.red}Fatal error:${c.reset}`, error)
  process.exit(1)
})
