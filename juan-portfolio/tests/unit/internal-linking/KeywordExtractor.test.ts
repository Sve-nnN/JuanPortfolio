import { describe, it, expect, beforeEach } from 'vitest';
import { KeywordExtractor } from '../../../src/scripts/internal-linking/KeywordExtractor';
import * as fs from 'fs';
import * as path from 'path';

describe('KeywordExtractor', () => {
    const testContentDir = path.join(process.cwd(), 'content');

    describe('generateVariations', () => {
        it('should generate basic variations for a simple keyword', () => {
            const extractor = new KeywordExtractor(testContentDir);
            // Access private method through any for testing
            const variations = (extractor as any).generateVariations('seo');

            expect(variations).toContain('seo');
            expect(variations).toContain('Seo');
            expect(variations).toContain('SEO');
            expect(variations).toContain('seos'); // plural
        });

        it('should handle plural keywords', () => {
            const extractor = new KeywordExtractor(testContentDir);
            const variations = (extractor as any).generateVariations('metrics');

            expect(variations).toContain('metrics');
            expect(variations).toContain('Metrics');
            expect(variations).toContain('METRICS');
            expect(variations).toContain('metric'); // singular
        });

        it('should handle hyphenated keywords', () => {
            const extractor = new KeywordExtractor(testContentDir);
            const variations = (extractor as any).generateVariations('core-web-vitals');

            expect(variations).toContain('core-web-vitals');
            expect(variations).toContain('core web vitals'); // space-separated
            expect(variations).toContain('Core-web-vitals');
        });

        it('should handle space-separated keywords', () => {
            const extractor = new KeywordExtractor(testContentDir);
            const variations = (extractor as any).generateVariations('technical seo');

            expect(variations).toContain('technical seo');
            expect(variations).toContain('technical-seo'); // hyphenated
            expect(variations).toContain('Technical seo');
        });
    });

    describe('extractKeywords', () => {
        it('should extract keywords from frontmatter', () => {
            const extractor = new KeywordExtractor(testContentDir);
            const frontmatter = {
                keywords: ['SEO', 'Performance', 'Core Web Vitals'],
            };
            const content = '# Test Content';

            const keywords = (extractor as any).extractKeywords(frontmatter, content);

            expect(keywords).toContain('seo');
            expect(keywords).toContain('performance');
            expect(keywords).toContain('core web vitals');
        });

        it('should extract keywords from relatedPosts', () => {
            const extractor = new KeywordExtractor(testContentDir);
            const frontmatter = {
                relatedPosts: ['nextjs-seo-optimization', 'web-performance-guide'],
            };
            const content = '# Test Content';

            const keywords = (extractor as any).extractKeywords(frontmatter, content);

            expect(keywords).toContain('nextjs');
            expect(keywords).toContain('optimization');
            expect(keywords).toContain('performance');
            expect(keywords).toContain('guide');
        });

        it('should extract keywords from H2 headings', () => {
            const extractor = new KeywordExtractor(testContentDir);
            const frontmatter = {};
            const content = `
# Main Title

## Core Web Vitals

Content here.

## SEO Best Practices

More content.
`;

            const keywords = (extractor as any).extractKeywords(frontmatter, content);

            expect(keywords).toContain('core web vitals');
            expect(keywords).toContain('seo best practices');
        });

        it('should filter out very short or very long headings', () => {
            const extractor = new KeywordExtractor(testContentDir);
            const frontmatter = {};
            const content = `
## SEO

## This is a very long heading that should be filtered out because it exceeds the maximum length

## Valid Heading
`;

            const keywords = (extractor as any).extractKeywords(frontmatter, content);

            expect(keywords).not.toContain('seo'); // Too short (3 chars)
            expect(keywords).not.toContain('this is a very long heading that should be filtered out because it exceeds the maximum length');
            expect(keywords).toContain('valid heading');
        });
    });

    describe('loadPosts', () => {
        it('should load posts from content directory', async () => {
            const extractor = new KeywordExtractor(testContentDir);
            const posts = await extractor.loadPosts();

            expect(posts.length).toBeGreaterThan(0);
            posts.forEach(post => {
                expect(post).toHaveProperty('slug');
                expect(post).toHaveProperty('title');
                expect(post).toHaveProperty('keywords');
                expect(post).toHaveProperty('category');
                expect(post).toHaveProperty('filePath');
                expect(post).toHaveProperty('url');
            });
        });

        it('should filter posts by category', async () => {
            const extractor = new KeywordExtractor(testContentDir);
            const posts = await extractor.loadPosts('tech-seo');

            expect(posts.length).toBeGreaterThan(0);
            posts.forEach(post => {
                expect(post.category).toBe('tech-seo');
            });
        });
    });

    describe('buildIndex', () => {
        it('should build keyword index from posts', async () => {
            const extractor = new KeywordExtractor(testContentDir);
            await extractor.loadPosts();
            const index = extractor.buildIndex();

            expect(index.size).toBeGreaterThan(0);

            // Check index structure
            for (const [keyword, match] of index.entries()) {
                expect(typeof keyword).toBe('string');
                expect(match).toHaveProperty('keyword');
                expect(match).toHaveProperty('variations');
                expect(match).toHaveProperty('targetPost');
                expect(match).toHaveProperty('priority');
                expect(Array.isArray(match.variations)).toBe(true);
            }
        });

        it('should prioritize keywords that appear first in post', async () => {
            const extractor = new KeywordExtractor(testContentDir);
            await extractor.loadPosts();
            const index = extractor.buildIndex();

            // Find keywords with priority differences
            const priorities = Array.from(index.values()).map(m => m.priority);
            const uniquePriorities = new Set(priorities);

            // Should have different priorities if there are multiple keywords
            expect(uniquePriorities.size).toBeGreaterThan(1);
        });
    });
});
