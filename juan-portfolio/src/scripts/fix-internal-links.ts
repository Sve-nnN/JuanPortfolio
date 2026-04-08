#!/usr/bin/env node
/**
 * Migration Script: Fix Internal Links
 * 
 * Replaces relative links like (/[category]/[slug]) with absolute links 
 * like (https://juan-tech.com/blog/[category]/[slug]).
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://juan-tech.com/blog';
const POSTS_DIR = path.resolve(process.cwd(), 'content/posts');

// ANSI Colors
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
};

function getAllFiles(dir: string, allFiles: string[] = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            getAllFiles(filePath, allFiles);
        } else if (file.endsWith('.md')) {
            allFiles.push(filePath);
        }
    }
    return allFiles;
}

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');

    console.log(`${colors.cyan}🔗 Internal Link Fixer Migration${colors.reset}\n`);
    if (dryRun) console.log(`${colors.yellow}💡 Dry run mode: No files will be modified.${colors.reset}\n`);

    if (!fs.existsSync(POSTS_DIR)) {
        console.error(`${colors.red}❌ Posts directory not found: ${POSTS_DIR}${colors.reset}`);
        return;
    }

    // Get all markdown files
    const files = getAllFiles(POSTS_DIR);
    console.log(`${colors.blue}📚 Found ${files.length} markdown files.${colors.reset}\n`);

    let totalFixed = 0;
    let modifiedFiles = 0;

    for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Regex to find relative links: [text](/path)
        const linkRegex = /\[([^\]]+)\]\(\/([^\)]+)\)/g;
        
        let fileFixedCount = 0;
        const newContent = content.replace(linkRegex, (match, text, urlPath) => {
            // Skip if it's already an absolute URL (shouldn't happen with / start)
            if (urlPath.startsWith('http')) return match;
            
            // Skip if it starts with blog/ already
            if (urlPath.startsWith('blog/')) return match;

            // Prepend BASE_URL
            fileFixedCount++;
            return `[${text}](${BASE_URL}/${urlPath})`;
        });

        if (fileFixedCount > 0) {
            totalFixed += fileFixedCount;
            modifiedFiles++;
            
            const relativePath = path.relative(process.cwd(), filePath);
            console.log(`${colors.green}✅ Found ${fileFixedCount} links to fix in:${colors.reset} ${relativePath}`);
            
            if (!dryRun) {
                fs.writeFileSync(filePath, newContent, 'utf-8');
            }
        }
    }

    console.log(`\n${colors.cyan}Summary:${colors.reset}`);
    console.log(`- Files processed: ${files.length}`);
    console.log(`- Files modified: ${modifiedFiles}`);
    console.log(`- Total links fixed: ${totalFixed}`);

    if (dryRun && totalFixed > 0) {
        console.log(`\n${colors.yellow}To apply these changes, run without --dry-run${colors.reset}`);
    }
}

main().catch(err => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, err);
    process.exit(1);
});
