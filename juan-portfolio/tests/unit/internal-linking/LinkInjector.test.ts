import { describe, it, expect } from 'vitest';
import { LinkInjector } from '../../../src/scripts/internal-linking/LinkInjector';
import type { LinkOpportunity, PostMetadata } from '../../../src/scripts/internal-linking/types';

describe('LinkInjector', () => {
    const mockTargetPost: PostMetadata = {
        slug: 'seo-guide',
        title: 'SEO Guide',
        primary_keywords: ['seo'],
        category: 'tech-seo',
        filePath: '/path/to/seo-guide.md',
        url: '/tech-seo/seo-guide',
        idioma: 'es',
        contentRole: 'pillar',
    };

    const mockSourcePost: PostMetadata = {
        slug: 'web-performance',
        title: 'Web Performance',
        primary_keywords: ['performance'],
        category: 'development',
        filePath: '/path/to/web-performance.md',
        url: '/development/web-performance',
        idioma: 'es',
        contentRole: 'satellite',
    };

    describe('insertLink', () => {
        it('should insert a markdown link correctly', () => {
            const injector = new LinkInjector();
            const line = 'This article discusses SEO techniques.';
            const opportunity: LinkOpportunity = {
                sourcePost: mockSourcePost,
                targetPost: mockTargetPost,
                keyword: 'SEO',
                context: line,
                lineNumber: 10,
                relevance: 0.8,
            };

            const result = (injector as any).insertLink(line, opportunity);

            expect(result).toBe('This article discusses [SEO](/tech-seo/seo-guide) techniques.');
        });

        it('should preserve original case of matched keyword', () => {
            const injector = new LinkInjector();
            const line = 'Learn about seo optimization.';
            const opportunity: LinkOpportunity = {
                sourcePost: mockSourcePost,
                targetPost: mockTargetPost,
                keyword: 'seo',
                context: line,
                lineNumber: 10,
                relevance: 0.8,
            };

            const result = (injector as any).insertLink(line, opportunity);

            expect(result).toBe('Learn about [seo](/tech-seo/seo-guide) optimization.');
        });

        it('should not insert link inside existing link', () => {
            const injector = new LinkInjector();
            const line = 'Check [SEO guide](https://other.com) here.';
            const opportunity: LinkOpportunity = {
                sourcePost: mockSourcePost,
                targetPost: mockTargetPost,
                keyword: 'SEO',
                context: line,
                lineNumber: 10,
                relevance: 0.8,
            };

            const result = (injector as any).insertLink(line, opportunity);

            // Should not modify because SEO is inside existing link
            expect(result).toBe(line);
        });

        it('should not insert link inside inline code', () => {
            const injector = new LinkInjector();
            const line = 'Use the `SEO` constant.';
            const opportunity: LinkOpportunity = {
                sourcePost: mockSourcePost,
                targetPost: mockTargetPost,
                keyword: 'SEO',
                context: line,
                lineNumber: 10,
                relevance: 0.8,
            };

            const result = (injector as any).insertLink(line, opportunity);

            // Should not modify because SEO is inside code
            expect(result).toBe(line);
        });

        it('should handle multiple spaces and special positioning', () => {
            const injector = new LinkInjector();
            const line = 'SEO is crucial for visibility.';
            const opportunity: LinkOpportunity = {
                sourcePost: mockSourcePost,
                targetPost: mockTargetPost,
                keyword: 'SEO',
                context: line,
                lineNumber: 10,
                relevance: 0.8,
            };

            const result = (injector as any).insertLink(line, opportunity);

            expect(result).toBe('[SEO](/tech-seo/seo-guide) is crucial for visibility.');
        });
    });

    describe('shouldSkipLine', () => {
        it('should skip headings', () => {
            const injector = new LinkInjector();

            expect((injector as any).shouldSkipLine('# Heading 1')).toBe(true);
            expect((injector as any).shouldSkipLine('## Heading 2')).toBe(true);
            expect((injector as any).shouldSkipLine('### Heading 3')).toBe(true);
        });

        it('should skip code blocks', () => {
            const injector = new LinkInjector();

            expect((injector as any).shouldSkipLine('```javascript')).toBe(true);
            expect((injector as any).shouldSkipLine('~~~python')).toBe(true);
        });

        it('should not skip normal text', () => {
            const injector = new LinkInjector();

            expect((injector as any).shouldSkipLine('This is normal text.')).toBe(false);
        });
    });

    describe('isInsideExcludedContext', () => {
        it('should detect keyword inside inline code', () => {
            const injector = new LinkInjector();
            const line = 'Use `SEO` for tagging.';
            const matchIndex = line.indexOf('SEO');

            expect((injector as any).isInsideExcludedContext(line, matchIndex, 3)).toBe(true);
        });

        it('should detect keyword inside link text', () => {
            const injector = new LinkInjector();
            const line = '[SEO guide](/path)';
            const matchIndex = line.indexOf('SEO');

            expect((injector as any).isInsideExcludedContext(line, matchIndex, 3)).toBe(true);
        });

        it('should detect keyword inside link URL', () => {
            const injector = new LinkInjector();
            const line = '[Guide](/SEO-guide)';
            const matchIndex = line.indexOf('SEO');

            expect((injector as any).isInsideExcludedContext(line, matchIndex, 3)).toBe(true);
        });

        it('should allow normal text', () => {
            const injector = new LinkInjector();
            const line = 'Learn about SEO today.';
            const matchIndex = line.indexOf('SEO');

            expect((injector as any).isInsideExcludedContext(line, matchIndex, 3)).toBe(false);
        });

        it('should handle multiple backticks correctly', () => {
            const injector = new LinkInjector();
            const line = 'Use `code` and SEO tags.';
            const matchIndex = line.indexOf('SEO');

            // SEO is after the closing backtick, so it should be allowed
            expect((injector as any).isInsideExcludedContext(line, matchIndex, 3)).toBe(false);
        });
    });

    describe('applyLinks', () => {
        it('should track modified posts and links added', () => {
            const injector = new LinkInjector();
            const opportunities = new Map<string, LinkOpportunity[]>();

            // In a real test, we'd mock fs.readFileSync and writeFileSync
            // For now, we're testing the structure
            const result = injector.applyLinks(opportunities, true);

            expect(result).toHaveProperty('modifiedPosts');
            expect(result).toHaveProperty('linksAdded');
            expect(result).toHaveProperty('skipped');
            expect(result).toHaveProperty('errors');
            expect(Array.isArray(result.modifiedPosts)).toBe(true);
            expect(Array.isArray(result.skipped)).toBe(true);
            expect(Array.isArray(result.errors)).toBe(true);
            expect(typeof result.linksAdded).toBe('number');
        });

        it('should not modify files in dry-run mode', () => {
            const injector = new LinkInjector();
            const opportunities = new Map<string, LinkOpportunity[]>();

            const result = injector.applyLinks(opportunities, true); // dry-run = true

            // In dry-run, no files should be written
            // This would be tested with fs mocks in a full integration test
            expect(result.linksAdded).toBe(0);
        });
    });
});
