#!/usr/bin/env node
/**
 * Internal Linking Automation Script
 * 
 * Automatically generates internal links between blog posts based on keyword matching.
 * 
 * Usage:
 *   npx tsx src/scripts/build-internal-links.ts [options]
 * 
 * Options:
 *   --dry-run              Preview changes without modifying files
 *   --category <name>      Process only specific category
 *   --max-links <n>        Max links per keyword per post (default: 3)
 *   --verbose              Show detailed matching logs
 *   --help                 Show this help message
 */

import * as path from 'path';
import { KeywordExtractor } from './internal-linking/KeywordExtractor';
import { ContentScanner } from './internal-linking/ContentScanner';
import { LinkInjector } from './internal-linking/LinkInjector';
import type { LinkingConfig } from './internal-linking/types';

// Parse command line arguments
function parseArgs(): LinkingConfig & { help: boolean } {
    const args = process.argv.slice(2);
    const config: LinkingConfig & { help: boolean } = {
        maxLinksPerKeyword: 3,
        minWordLength: 3,
        excludePatterns: [
            /^```/,           // Code blocks
            /^#{1,6}\s/,      // Headings
            /^---$/,          // Frontmatter
            /^\s*[-*+]\s*$/,  // Empty list items
        ],
        dryRun: false,
        verbose: false,
        help: false,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--dry-run':
                config.dryRun = true;
                break;
            case '--category':
                config.category = args[++i];
                break;
            case '--max-links':
                config.maxLinksPerKeyword = parseInt(args[++i], 10);
                break;
            case '--verbose':
                config.verbose = true;
                break;
            case '--help':
            case '-h':
                config.help = true;
                break;
            default:
                console.warn(`Unknown option: ${arg}`);
        }
    }

    return config;
}

// Display help message
function showHelp(): void {
    console.log(`
Internal Linking Automation Script

Usage:
  npx tsx src/scripts/build-internal-links.ts [options]

Options:
  --dry-run              Preview changes without modifying files
  --category <name>      Process only specific category (e.g., tech-seo)
  --max-links <n>        Max links per keyword per post (default: 3)
  --verbose              Show detailed matching logs
  --help, -h             Show this help message

Examples:
  # Preview changes for all posts
  npx tsx src/scripts/build-internal-links.ts --dry-run --verbose

  # Process only tech-seo category
  npx tsx src/scripts/build-internal-links.ts --category tech-seo

  # Apply links with custom limit
  npx tsx src/scripts/build-internal-links.ts --max-links 5
`);
}

// Main execution
async function main(): Promise<void> {
    const config = parseArgs();

    if (config.help) {
        showHelp();
        return;
    }

    console.log('🔗 Internal Linking Script Started\n');
    console.log('Configuration:');
    console.log(`  Dry Run: ${config.dryRun ? 'Yes' : 'No'}`);
    console.log(`  Category: ${config.category || 'All'}`);
    console.log(`  Max Links Per Keyword: ${config.maxLinksPerKeyword}`);
    console.log(`  Verbose: ${config.verbose ? 'Yes' : 'No'}`);
    console.log();

    const contentDir = path.resolve(process.cwd(), 'content');

    // Step 1: Extract keywords and build index
    console.log('📚 Step 1: Loading posts and extracting keywords...');
    const extractor = new KeywordExtractor(contentDir);
    const posts = await extractor.loadPosts(config.category);
    console.log(`  Loaded ${posts.length} posts`);

    const keywordIndex = extractor.buildIndex();
    console.log(`  Built index with ${keywordIndex.size} keyword entries`);

    if (config.verbose) {
        console.log('\n  Keyword Index Sample:');
        let count = 0;
        for (const [keyword, match] of keywordIndex.entries()) {
            if (count++ >= 5) break;
            console.log(`    - "${keyword}" → ${match.targetPost.url}`);
        }
    }

    // Step 2: Scan posts for linking opportunities
    console.log('\n🔍 Step 2: Scanning posts for linking opportunities...');
    const scanner = new ContentScanner(keywordIndex, config);
    const opportunities = scanner.scanAllPosts(posts);

    let totalOpportunities = 0;
    for (const ops of opportunities.values()) {
        totalOpportunities += ops.length;
    }
    console.log(`  Found ${totalOpportunities} linking opportunities across ${opportunities.size} posts`);

    if (config.verbose && opportunities.size > 0) {
        console.log('\n  Top Opportunities by Post:');
        let postCount = 0;
        for (const [slug, ops] of opportunities.entries()) {
            if (postCount++ >= 3) break;
            console.log(`\n    ${slug}:`);
            ops.slice(0, 3).forEach(opp => {
                console.log(`      - "${opp.keyword}" → ${opp.targetPost.url} (relevance: ${opp.relevance.toFixed(2)})`);
            });
        }
    }

    // Step 3: Identify content gaps
    console.log('\n🔎 Step 3: Analyzing content gaps...');
    const contentGaps = scanner.findContentGaps(posts);

    const gaps: import('./internal-linking/types').KeywordGap[] = [];
    for (const [keyword, data] of contentGaps.entries()) {
        // Only recommend keywords mentioned at least 3 times
        if (data.count >= 3) {
            gaps.push({
                keyword,
                mentionCount: data.count,
                mentionedIn: Array.from(data.sources),
                category: data.category
            });
        }
    }

    console.log(`  Found ${gaps.length} content gap opportunities`);

    // Step 4: Add recommendations to keywords.md
    if (gaps.length > 0) {
        const { RecommendationTracker } = await import('./internal-linking/RecommendationTracker');
        const tracker = new RecommendationTracker(contentDir);
        tracker.loadExistingKeywords();

        const added = tracker.addRecommendations(gaps, config.dryRun);
        console.log(`  ${config.dryRun ? 'Would add' : 'Added'} ${added} recommendations to keywords.md`);

        if (config.verbose && gaps.length > 0) {
            console.log('\n  Top Content Gaps:');
            gaps.slice(0, 5).forEach(gap => {
                console.log(`    - "${gap.keyword}" (${gap.mentionCount} mentions in ${gap.mentionedIn.length} posts)`);
            });
        }
    }

    // Step 5: Apply links
    console.log('\n✍️  Step 5: Applying links...');
    const injector = new LinkInjector();
    const result = injector.applyLinks(opportunities, config.dryRun);

    console.log(`  Links added: ${result.linksAdded}`);
    console.log(`  Posts modified: ${result.modifiedPosts.length}`);
    console.log(`  Opportunities skipped: ${result.skipped.length}`);
    console.log(`  Errors: ${result.errors.length}`);

    if (config.verbose && result.skipped.length > 0) {
        console.log('\n  Skip Reasons Summary:');
        const reasons = new Map<string, number>();
        result.skipped.forEach(({ reason }) => {
            reasons.set(reason, (reasons.get(reason) || 0) + 1);
        });
        for (const [reason, count] of reasons.entries()) {
            console.log(`    - ${reason}: ${count}`);
        }
    }

    if (result.errors.length > 0) {
        console.log('\n❌ Errors:');
        result.errors.forEach(({ post, error }) => {
            console.error(`❌ Error processing ${post}: ${error}`);
        });
    }

    if (config.dryRun) {
        console.log('\n💡 This was a dry run. No files were modified.');
        console.log('   Remove --dry-run to apply changes.');
    } else {
        console.log('\n✅ Internal linking complete!');

        if (result.modifiedPosts.length > 0) {
            console.log('\n📝 Modified Files:');
            result.modifiedPosts.forEach(file => {
                console.log(`  - ${path.relative(process.cwd(), file)}`);
            });
        }
    }

    console.log();
}

// Run
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
