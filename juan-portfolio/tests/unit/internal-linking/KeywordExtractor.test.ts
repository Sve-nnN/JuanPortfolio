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

    describe('generateSemanticKeywords (private method test)', () => {
        it('should generate multi-word semantic keywords and skip generic ones', () => {
            const extractor = new KeywordExtractor(TEST_DIR);
            // Using a text that is more likely to trigger the current N-gram logic
            const content = "The implementation of technical infrastructure and advanced software architecture is key for performance. Version coming soon. Read more here.";
            const keywords = (extractor as any).generateSemanticKeywords(content, 'en');
            
            // Should NOT include single words (per new "Killer" rules)
            expect(keywords.every((k: string) => k.split(' ').length >= 2)).toBe(true);
            
            // Should NOT include blacklisted words like 'version' or 'soon'
            expect(keywords.some((k: string) => k.includes('version'))).toBe(false);
            expect(keywords.some((k: string) => k.includes('soon'))).toBe(false);
        });
    });

    describe('validateKeywordLanguage (private method test)', () => {
        it('should allow technical terms even if they look like the other language', () => {
            const extractor = new KeywordExtractor(TEST_DIR);
            // These are now whitelisted technical terms
            expect((extractor as any).validateKeywordLanguage('seo técnico', 'es', 'test-slug', 'primary')).toBe(true);
            expect((extractor as any).validateKeywordLanguage('payload cms api', 'es', 'test-slug', 'primary')).toBe(true);
            expect((extractor as any).validateKeywordLanguage('ssr vs csr', 'es', 'test-slug', 'primary')).toBe(true);
        });

        it('should block obvious language mismatches with many stop words', () => {
            const extractor = new KeywordExtractor(TEST_DIR);
            // Spanish phrase in English post
            expect((extractor as any).validateKeywordLanguage('la guía de enlaces', 'en', 'test-slug', 'primary')).toBe(false);
        });
    });

    describe('loadPosts', () => {
        it('should load posts and parse primary/semantic keywords', async () => {
            const postContent = `---
title: A Post
primary_keywords: [primary one, primary two]
semantic_keywords: [semantic one, semantic two]
---
Content
`;
            await createMockFile(path.join(TEST_DIR, 'posts', 'test-cat', 'test-post.md'), postContent);
            
            const extractor = new KeywordExtractor(TEST_DIR);
            const posts = await extractor.loadPosts();

            expect(posts.length).toBe(1);
            const post = posts[0];
            expect(post).toHaveProperty('slug', 'test-post');
            expect(post.primary_keywords).toContain('primary one');
            expect(post.semantic_keywords).toContain('semantic one');
        });
    });

    describe('buildIndex', () => {
        it('should build keyword index from keywords', async () => {
            const post1 = `---
title: Post One
idioma: en
primary_keywords: [keyword a]
semantic_keywords: [semantic keyword b]
---
content here`;
            const post2 = `---
title: Post Two
idioma: en
primary_keywords: [keyword c]
---
more content`;
            await createMockFile(path.join(TEST_DIR, 'posts', 'cat', 'post1.md'), post1);
            await createMockFile(path.join(TEST_DIR, 'posts', 'cat', 'post2.md'), post2);

            const extractor = new KeywordExtractor(TEST_DIR);
            await extractor.loadPosts();
            const index = extractor.buildIndex();

            expect(index.has('keyword a')).toBe(true);
            expect(index.get('keyword a')?.targetPost.slug).toBe('post1');
            expect(index.has('keyword c')).toBe(true);
            expect(index.get('keyword c')?.targetPost.slug).toBe('post2');
            expect(index.has('semantic keyword b')).toBe(true);
        });

        it('should warn on keyword cannibalization', async () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const post1 = `---
title: Post One
idioma: en
primary_keywords: [shared keyword]
---
content`;
            const post2 = `---
title: Post Two
idioma: en
primary_keywords: [shared keyword]
---
content`;
            await createMockFile(path.join(TEST_DIR, 'posts', 'cat', 'post1.md'), post1);
            await createMockFile(path.join(TEST_DIR, 'posts', 'cat', 'post2.md'), post2);

            const extractor = new KeywordExtractor(TEST_DIR);
            await extractor.loadPosts();
            extractor.buildIndex();

            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Keyword Cannibalization Warning'));
            
            consoleWarnSpy.mockRestore();
        });
    });
});
