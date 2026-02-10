import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { KeywordExtractor } from '../../src/scripts/internal-linking/KeywordExtractor';
import { ContentScanner } from '../../src/scripts/internal-linking/ContentScanner';
import { LinkInjector } from '../../src/scripts/internal-linking/LinkInjector';
import type { LinkingConfig, LinkOpportunity } from '../../src/scripts/internal-linking/types';

const TEST_DIR = path.resolve(process.cwd(), 'tmp-test-content-for-linking');

// Helper to create mock files
const createMockFile = async (filePath: string, content: string) => {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
};

describe('Internal Linking Script', () => {
    beforeEach(async () => {
        await fs.rm(TEST_DIR, { recursive: true, force: true });
        await fs.mkdir(TEST_DIR, { recursive: true });
    });

    afterAll(async () => {
        await fs.rm(TEST_DIR, { recursive: true, force: true });
    });

    describe('KeywordExtractor', () => {

        it('should extract primary and semantic keywords from frontmatter', async () => {
            const postContent = `---
title: Big O Notation Guide
primary_keywords:
  - big o notation
  - notacion big o
semantic_keywords:
  - complejidad
  - rendimiento
---
Hello world.
`;
            await createMockFile(path.join(TEST_DIR, 'posts', 'cs-fundamentals', 'big-o.md'), postContent);

            const extractor = new KeywordExtractor(TEST_DIR);
            const posts = await extractor.loadPosts();
            
            expect(posts).toHaveLength(1);
            const post = posts[0];
            expect(post.primary_keywords).toEqual(['big o notation', 'notacion big o']);
            expect(post.semantic_keywords).toEqual(['complejidad', 'rendimiento']);
        });

        it('should build a correct keywordIndex from primary_keywords', async () => {
            const post1 = `---
title: Big O Notation
primary_keywords: [big o notation]
---
`;
            const post2 = `---
title: Algorithmic Complexity
primary_keywords: [complejidad algoritmica]
---
`;
            await createMockFile(path.join(TEST_DIR, 'posts', 'cs', 'big-o.md'), post1);
            await createMockFile(path.join(TEST_DIR, 'posts', 'cs', 'complexity.md'), post2);
            
            const extractor = new KeywordExtractor(TEST_DIR);
            await extractor.loadPosts();
            const index = extractor.buildIndex();

            expect(index.has('big o notation')).toBe(true);
            expect(index.get('big o notation')?.targetPost.slug).toBe('big-o');
            expect(index.has('complejidad algoritmica')).toBe(true);
            expect(index.get('complejidad algoritmica')?.targetPost.slug).toBe('complexity');
        });
    });

    describe('ContentScanner', () => {
        const config: LinkingConfig = {
            dryRun: true, verbose: false, maxLinksPerKeyword: 3,
            minWordLength: 3, excludePatterns: []
        };

        it('should find link opportunities', async () => {
            const post1 = `---
title: Big O Notation
primary_keywords: [big o notation, notacion big o]
---
`;
            const post2 = `---
title: Algorithmic Complexity
---
Hablemos de la notacion big o.
`;
            await createMockFile(path.join(TEST_DIR, 'posts', 'cs', 'big-o.md'), post1);
            await createMockFile(path.join(TEST_DIR, 'posts', 'cs', 'complexity.md'), post2);
            
            const extractor = new KeywordExtractor(TEST_DIR);
            const posts = await extractor.loadPosts();
            const index = extractor.buildIndex();
            const scanner = new ContentScanner(index, config);

            const complexityPost = posts.find(p => p.slug === 'complexity')!;
            
            const opportunities = scanner.scanPost(complexityPost, posts);
            expect(opportunities.length).toBeGreaterThan(0);
            expect(opportunities[0].keyword).toBe('notacion big o');
            expect(opportunities[0].targetPost.slug).toBe('big-o');
        });

        it('should assign a high relevance score for contextually relevant links', async () => {
            const post1 = `---
title: Big O Notation
primary_keywords: [notacion big o]
semantic_keywords: [complejidad]
---
`;
            const post2 = `---
title: Algorithmic Complexity
---
Hablemos de la notacion big o. Mide la complejidad.
`;
            await createMockFile(path.join(TEST_DIR, 'posts', 'cs', 'big-o.md'), post1);
            await createMockFile(path.join(TEST_DIR, 'posts', 'cs', 'complexity.md'), post2);

            const extractor = new KeywordExtractor(TEST_DIR);
            const posts = await extractor.loadPosts();
            const index = extractor.buildIndex();
            const scanner = new ContentScanner(index, config);
            const complexityPost = posts.find(p => p.slug === 'complexity')!;
            
            const opportunities = scanner.scanPost(complexityPost, posts);
            expect(opportunities[0].relevance).toBeGreaterThan(0.8);
        });
    });

    describe('LinkInjector', () => {
        it('should correctly insert a markdown link', async () => {
            const postContent = "Hablemos de la notacion big o. Mide la complejidad.";
            const postPath = path.join(TEST_DIR, 'posts', 'injector', 'test-post.md');
            await createMockFile(postPath, `---
title: Test
---
${postContent}`);

            const sourcePost: any = { slug: 'test-post', filePath: postPath, primary_keywords:[] };
            const targetPost: any = { url: '/cs/big-o' };

            const opportunity: LinkOpportunity = {
                sourcePost,
                targetPost,
                keyword: 'notacion big o',
                context: postContent,
                lineNumber: 4, // Line number is after frontmatter
                relevance: 1,
            };

            const injector = new LinkInjector();
            injector.applyLinks(new Map([['test-post', [opportunity]]]), false);

            const newContent = await fs.readFile(postPath, 'utf-8');
            
            const expectedContent = `---
title: Test
---
Hablemos de la [notacion big o](/cs/big-o). Mide la complejidad.
`;
            expect(newContent.trim()).toBe(expectedContent.trim());
        });

        it('should not modify files in dry-run mode', async () => {
            const postContent = "Hablemos de la notacion big o.";
            const postPath = path.join(TEST_DIR, 'posts', 'injector', 'dry-run-test.md');
            await createMockFile(postPath, `---
title: Test
---
${postContent}`);

            const sourcePost: any = { slug: 'dry-run-test', filePath: postPath, primary_keywords:[] };
            const targetPost: any = { url: '/cs/big-o' };
            const opportunity: any = { sourcePost, targetPost, keyword: 'notacion big o', lineNumber: 4 };
            
            const injector = new LinkInjector();
            injector.applyLinks(new Map([['dry-run-test', [opportunity]]]), true);

            const contentAfter = await fs.readFile(postPath, 'utf-8');
            expect(contentAfter.trim()).toBe(`---
title: Test
---
${postContent}`.trim());
        });
    });
});