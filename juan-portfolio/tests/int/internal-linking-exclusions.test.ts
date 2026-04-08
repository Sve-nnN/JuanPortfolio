import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { KeywordExtractor } from '../../src/scripts/internal-linking/KeywordExtractor';
import { ContentScanner } from '../../src/scripts/internal-linking/ContentScanner';
import type { LinkingConfig } from '../../src/scripts/internal-linking/types';

const TEST_DIR = path.resolve(process.cwd(), 'tmp-test-content-for-linking-exclusions');

// Helper to create mock files
const createMockFile = async (filePath: string, content: string) => {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
};

describe('Internal Linking Script - Exclusions', () => {
    const config: LinkingConfig = {
        dryRun: true, verbose: false, maxLinksPerKeyword: 3,
        minWordLength: 3, excludePatterns: [],
        semantic: { enabled: false }
    };

    beforeAll(async () => {
        await fs.rm(TEST_DIR, { recursive: true, force: true });
        await fs.mkdir(TEST_DIR, { recursive: true });
    });

    afterAll(async () => {
        await fs.rm(TEST_DIR, { recursive: true, force: true });
    });

    it('should exclude keywords inside code blocks and headings', async () => {
        const isolatedTestDir = path.join(TEST_DIR, 'exclude-test-isolated');
        const post1 = `---
title: Big O Notation
primary_keywords: [notacion big o]
semantic_keywords: []
---
`;
        await createMockFile(path.join(isolatedTestDir, 'posts', 'cs', 'big-o.md'), post1);

        const extractor = new KeywordExtractor(isolatedTestDir);
        const postWithExclusionsContent = `---
title: Another Post
semantic_keywords: []
---
# No link for notacion big o here
\`\`\`
// No link for notacion big o in code
\`\`\`
Pero sí hay un link para notacion big o aquí.
`;
        const tempFilePath = path.join(isolatedTestDir, 'posts/cs/another-post.md');
        await createMockFile(tempFilePath, postWithExclusionsContent)

        // Load posts after all files are created
        const allPosts = await extractor.loadPosts();
        const index = extractor.buildIndex();
        const scanner = new ContentScanner(index, config);
        const anotherPost = allPosts.find(p => p.slug === 'another-post');
        
        const opportunities = scanner.scanPost(anotherPost!, allPosts);
        
        if (opportunities.length !== 1) {
            console.log('Test failed. Opportunities found:', opportunities.map(o => ({
                keyword: o.keyword,
                line: o.lineNumber,
                context: o.context
            })));
        }

        expect(opportunities).toHaveLength(1);
        expect(opportunities[0].lineNumber).toBe(9);

    });
});
