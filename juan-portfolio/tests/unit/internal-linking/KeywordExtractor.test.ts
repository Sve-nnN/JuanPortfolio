import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KeywordExtractor } from '../../../src/scripts/internal-linking/KeywordExtractor';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock file system
const TEST_DIR = path.resolve(process.cwd(), 'tmp-unit-test-content');

const createMockFile = async (filePath: string, content: string) => {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
};

describe('KeywordExtractor', () => {

    beforeEach(async () => {
        await fs.rm(TEST_DIR, { recursive: true, force: true });
        await fs.mkdir(TEST_DIR, { recursive: true });
    });

    describe('generateVariations (private method test)', () => {
        it('should generate basic variations for a simple keyword', () => {
            const extractor = new KeywordExtractor(TEST_DIR);
            const variations = (extractor as any).generateVariations('seo');
            expect(variations).toEqual(expect.arrayContaining(['seo', 'Seo', 'SEO', 'seos']));
        });
    });

    describe('loadPosts', () => {
        it('should load posts and parse primary/semantic keywords', async () => {
            const postContent = `---
title: A Post
primary_keywords: [primary one, primary two]
semantic_keywords: [semantic one]
---
Content
`;
            await createMockFile(path.join(TEST_DIR, 'posts', 'test-cat', 'test-post.md'), postContent);
            
            const extractor = new KeywordExtractor(TEST_DIR);
            const posts = await extractor.loadPosts();

            expect(posts.length).toBe(1);
            const post = posts[0];
            expect(post).toHaveProperty('slug', 'test-post');
            expect(post).toHaveProperty('primary_keywords', ['primary one', 'primary two']);
            expect(post).toHaveProperty('semantic_keywords', ['semantic one']);
        });
    });

    describe('buildIndex', () => {
        it('should build keyword index only from primary_keywords', async () => {
            const post1 = `---
title: Post One
primary_keywords: [keyword a]
semantic_keywords: [keyword b]
---`;
            const post2 = `---
title: Post Two
primary_keywords: [keyword c]
---`;
            await createMockFile(path.join(TEST_DIR, 'posts', 'cat', 'post1.md'), post1);
            await createMockFile(path.join(TEST_DIR, 'posts', 'cat', 'post2.md'), post2);
            
            const extractor = new KeywordExtractor(TEST_DIR);
            await extractor.loadPosts();
            const index = extractor.buildIndex();

            expect(index.has('keyword a')).toBe(true);
            expect(index.get('keyword a')?.targetPost.slug).toBe('post1');
            expect(index.has('keyword c')).toBe(true);
            expect(index.get('keyword c')?.targetPost.slug).toBe('post2');
            // Ensure semantic keywords are NOT in the index
            expect(index.has('keyword b')).toBe(false);
        });

        it('should warn on keyword cannibalization', async () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const post1 = `---
title: Post One
primary_keywords: [shared keyword]
---`;
            const post2 = `---
title: Post Two
primary_keywords: [shared keyword]
---`;
            await createMockFile(path.join(TEST_DIR, 'posts', 'cat', 'post1.md'), post1);
            await createMockFile(path.join(TEST_DIR, 'posts', 'cat', 'post2.md'), post2);

            const extractor = new KeywordExtractor(TEST_DIR);
            await extractor.loadPosts();
            extractor.buildIndex();

            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Keyword Cannibalization Warning'));
            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('"shared keyword"'));
            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('post1'));
            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('post2'));

            consoleWarnSpy.mockRestore();
        });
    });
});
