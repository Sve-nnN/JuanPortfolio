import { describe, it, expect } from 'vitest';
import { ContentScanner } from '../../../src/scripts/internal-linking/ContentScanner';
import type { PostMetadata, KeywordMatch, LinkingConfig } from '../../../src/scripts/internal-linking/types';

describe('ContentScanner', () => {
    const mockConfig: LinkingConfig = {
        maxLinksPerKeyword: 3,
        minWordLength: 3,
        excludePatterns: [],
        dryRun: false,
        verbose: false,
    };

    // Updated mock to use new PostMetadata structure
    const mockTargetPost: PostMetadata = {
        slug: 'seo-guide',
        title: 'SEO Guide',
        primary_keywords: ['seo', 'optimization'],
        semantic_keywords: ['ranking', 'serp', 'google'],
        category: 'tech-seo',
        filePath: '/path/to/seo-guide.md',
        url: '/tech-seo/seo-guide',
        idioma: 'es',
        contentRole: 'satellite',
    };

    const mockSourcePost: PostMetadata = {
        slug: 'web-performance',
        title: 'Web Performance',
        primary_keywords: ['performance', 'speed'],
        category: 'development',
        filePath: '/path/to/web-performance.md',
        url: '/development/web-performance',
        idioma: 'es',
        contentRole: 'satellite',
    };

    describe('calculateRelevance', () => {
        it('should give a higher score for an exact primary keyword match', () => {
            const keywordIndex = new Map<string, KeywordMatch>();
            const scanner = new ContentScanner(keywordIndex, mockConfig);

            const match: KeywordMatch = {
                keyword: 'seo',
                variations: ['seo', 'SEO', 'seos'],
                targetPost: mockTargetPost,
                priority: 1,
            };
            const context = 'This article discusses seo techniques.';

            const exactScore = (scanner as any).calculateRelevance('seo', match, context, mockSourcePost);
            const variationScore = (scanner as any).calculateRelevance('SEOs', match, context, mockSourcePost);

            // Exact match of the canonical keyword must score higher than a variation
            expect(exactScore).toBeGreaterThan(variationScore);
            // Score must be a valid 0-1 probability
            expect(exactScore).toBeGreaterThan(0);
            expect(exactScore).toBeLessThanOrEqual(1);
        });

        it('should give a lower score for a variation match than an exact match', () => {
            const keywordIndex = new Map<string, KeywordMatch>();
            const scanner = new ContentScanner(keywordIndex, mockConfig);

            const match: KeywordMatch = {
                keyword: 'seo',
                variations: ['seo', 'SEO', 'seos'],
                targetPost: mockTargetPost,
                priority: 1,
            };
            const context = 'This article discusses SEOs techniques.';

            const variationScore = (scanner as any).calculateRelevance('SEOs', match, context, mockSourcePost);
            const exactScore = (scanner as any).calculateRelevance('seo', match, context, mockSourcePost);

            // A variation keyword scores strictly lower than the canonical keyword
            expect(variationScore).toBeLessThan(exactScore);
            expect(variationScore).toBeGreaterThan(0);
        });

        it('should add a significant bonus for semantic context', () => {
            const keywordIndex = new Map<string, KeywordMatch>();
            const scanner = new ContentScanner(keywordIndex, mockConfig);
            const match: KeywordMatch = {
                keyword: 'seo',
                variations: ['seo'],
                targetPost: mockTargetPost,
                priority: 1,
            };

            // Rich context contains semantic keywords of the target post: 'ranking', 'google'
            const richContext = 'This seo article talks about ranking on google.';
            const plainContext = 'This is an article about seo.';

            const richScore = (scanner as any).calculateRelevance('seo', match, richContext, mockSourcePost);
            const plainScore = (scanner as any).calculateRelevance('seo', match, plainContext, mockSourcePost);

            // Semantically rich context must produce a strictly higher score
            expect(richScore).toBeGreaterThan(plainScore);
            expect(richScore).toBeLessThanOrEqual(1);
            expect(plainScore).toBeGreaterThan(0);
        });
    });

    // ---- Locale isolation ----

    describe('locale isolation', () => {
        it('should not generate opportunities from an es source to an en target', () => {
            // Target is en, source is es — no linking should occur
            const enTarget: PostMetadata = {
                slug: 'seo-guide-en',
                title: 'SEO Guide EN',
                primary_keywords: ['seo'],
                category: 'tech-seo',
                filePath: '/path/to/seo-guide.en.md',
                url: '/en/tech-seo/seo-guide',
                idioma: 'en',
                contentRole: 'pillar',
            };
            const keywordIndex = new Map<string, KeywordMatch>();
            keywordIndex.set('seo', {
                keyword: 'seo',
                variations: ['seo', 'SEO'],
                targetPost: enTarget,
                priority: 1,
            });
            const scanner = new ContentScanner(keywordIndex, mockConfig);

            // Internal method: locale check should filter out en target for es source
            const isFiltered = (scanner as any).isDifferentLocale(enTarget, mockSourcePost);
            expect(isFiltered).toBe(true);
        });

        it('should not filter posts of the same locale', () => {
            const esTarget: PostMetadata = {
                ...mockTargetPost,
                idioma: 'es',
            };
            const scanner = new ContentScanner(new Map(), mockConfig);
            const isFiltered = (scanner as any).isDifferentLocale(esTarget, mockSourcePost);
            expect(isFiltered).toBe(false);
        });
    });
});
