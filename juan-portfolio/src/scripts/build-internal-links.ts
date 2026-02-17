#!/usr/bin/env node
/**
 * Internal Linking Automation Script
 * 
 * Automatically generates internal links between blog posts based on keyword matching.
 */

import * as path from 'path';
import { KeywordExtractor } from './internal-linking/KeywordExtractor';
import { ContentScanner } from './internal-linking/ContentScanner';
import { LinkInjector } from './internal-linking/LinkInjector';
import type { LinkingConfig, LinkOpportunity } from './internal-linking/types';
import enquirer from 'enquirer';

const { Confirm } = enquirer as any;

// ANSI Colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
};

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
                console.warn(`${colors.yellow}⚠️ Unknown option: ${arg}${colors.reset}`);
        }
    }

    return config;
}

// Display help message
function showHelp(): void {
    console.log(`
${colors.bright}${colors.cyan}🔗 Internal Linking Automation${colors.reset}

${colors.bright}Usage:${colors.reset}
  npx tsx src/scripts/build-internal-links.ts [options]

${colors.bright}Options:${colors.reset}
  --dry-run              Preview changes without modifying files
  --category <name>      Process only specific category (e.g., tech-seo)
  --max-links <n>        Max links per keyword per post (default: 3)
  --include-test         Include posts in the 'test' directory
  --verbose              Show detailed matching logs
  --help, -h             Show this help message

${colors.bright}Examples:${colors.reset}
  # Preview changes
  npx tsx src/scripts/build-internal-links.ts --dry-run

  # Apply links to a category
  npx tsx src/scripts/build-internal-links.ts --category tech
`);
}

/**
 * Main TUI Execution
 */
async function main(): Promise<void> {
    const config = parseArgs();

    if (config.help) {
        showHelp();
        return;
    }

    console.clear();
    console.log(`${colors.bright}${colors.cyan}🔗 Internal Linking Manager${colors.reset}\n`);

    const contentDir = path.resolve(process.cwd(), 'content');

    // 1. Loading
    process.stdout.write(`${colors.blue}📚 Loading posts, generating semantic keywords (if missing), and building index...${colors.reset}`);
    const extractor = new KeywordExtractor(contentDir);
    const posts = await extractor.loadPosts(config.category);
    const keywordIndex = extractor.buildIndex();
    process.stdout.write(`\r${colors.green}✅ Loaded ${posts.length} posts, generated/updated semantic keywords, and indexed ${keywordIndex.size} keywords.    \n\n${colors.reset}`);

    // 2. Scanning
    process.stdout.write(`${colors.blue}🔍 Scanning posts for link opportunities...${colors.reset}`);
    const scanner = new ContentScanner(keywordIndex, config);
    const opportunitiesMap = scanner.scanAllPosts(posts);
    process.stdout.write(`\r${colors.green}✅ Scan complete! Found opportunities in ${opportunitiesMap.size} posts.${colors.reset}\n\n`);

    if (opportunitiesMap.size === 0) {
        console.log(`${colors.yellow}No new link opportunities found.${colors.reset}`);
        return;
    }

    // 3. Display Opportunities by Post
    console.log(`${colors.bright}Found Opportunities:${colors.reset}`);
    
    let totalOpportunities = 0;
    for (const [slug, ops] of opportunitiesMap.entries()) {
        totalOpportunities += ops.length;
        console.log(`\n${colors.magenta}📄 ${slug}${colors.reset} ${colors.dim}(${ops.length} links)${colors.reset}`);
        
        ops.forEach(opp => {
            console.log(`  ${colors.cyan}→${colors.reset} "${colors.bright}${opp.keyword}${colors.reset}" 🔗 ${colors.blue}${opp.targetPost.url}${colors.reset} ${colors.dim}(line ${opp.lineNumber})${colors.reset}`);
        });
    }

    console.log(`\n${colors.bright}Summary: ${totalOpportunities} total opportunities across ${opportunitiesMap.size} posts.${colors.reset}\n`);

    // 4. Content Gaps
    const contentGaps = scanner.findContentGaps(posts);
    const gaps = Array.from(contentGaps.entries())
        .filter(([_, data]) => data.count >= 3)
        .map(([keyword, data]) => ({
            keyword,
            mentionCount: data.count,
            mentionedIn: Array.from(data.sources),
            category: data.category
        }));

    if (gaps.length > 0) {
        console.log(`${colors.yellow}💡 Recommendation: ${gaps.length} content gaps identified (keywords mentioned ≥ 3 times but no post exists).${colors.reset}`);
        if (config.verbose) {
            gaps.forEach(gap => {
                console.log(`   - "${gap.keyword}" (${gap.mentionCount} mentions)`);
            });
        }
        console.log();
    }

    // 5. Confirmation and Application
    if (config.dryRun) {
        console.log(`${colors.yellow}💡 Dry run enabled. No files will be modified.${colors.reset}`);
        return;
    }

    const prompt = new Confirm({
        name: 'confirm',
        message: 'Do you want to apply these links to your posts?'
    });

    const confirmed = await prompt.run();

    if (confirmed) {
        console.log(`\n${colors.blue}✍️  Applying links...${colors.reset}`);
        const injector = new LinkInjector();
        const result = injector.applyLinks(opportunitiesMap, false);

        console.log(`${colors.green}✅ Successfully added ${result.linksAdded} links across ${result.modifiedPosts.length} files.${colors.reset}`);
        
        if (result.errors.length > 0) {
            console.log(`\n${colors.red}❌ Encountered ${result.errors.length} errors:${colors.reset}`);
            result.errors.forEach(err => console.log(`   - ${err.post}: ${err.error}`));
        }

        // Add recommendations if any
        if (gaps.length > 0) {
            const { RecommendationTracker } = await import('./internal-linking/RecommendationTracker');
            const tracker = new RecommendationTracker(contentDir);
            tracker.loadExistingKeywords();
            const added = tracker.addRecommendations(gaps, false);
            if (added > 0) {
                console.log(`${colors.green}✅ Added ${added} recommendations to keywords.md${colors.reset}`);
            }
        }
    } else {
        console.log(`\n${colors.yellow}Operation cancelled. No changes applied.${colors.reset}`);
    }

    console.log();
}

// Run
main().catch(error => {
    console.error(`\n${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
});