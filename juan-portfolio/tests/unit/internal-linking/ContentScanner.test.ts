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
    };

    const mockSourcePost: PostMetadata = {
        slug: 'web-performance',
        title: 'Web Performance',
        primary_keywords: ['performance', 'speed'],
        category: 'development',
        filePath: '/path/to/web-performance.md',
        url: '/development/web-performance',
    };

    describe('calculateRelevance', () => {
        it('should give a high score for an exact primary keyword match', () => {
            const keywordIndex = new Map<string, KeywordMatch>();
            const scanner = new ContentScanner(keywordIndex, mockConfig);

            const match: KeywordMatch = {
                keyword: 'seo',
                variations: ['seo', 'SEO', 'seos'],
                targetPost: mockTargetPost,
                priority: 1,
            };
            const context = 'This article discusses seo techniques.';

            // The keyword 'seo' is the canonical primary keyword
            const score = (scanner as any).calculateRelevance('seo', match, context, mockSourcePost);
            expect(score).toBeCloseTo(0.4 + 0.3); // base + exact_match bonus
        });

        it('should give a lower score for a variation match', () => {
            const keywordIndex = new Map<string, KeywordMatch>();
            const scanner = new ContentScanner(keywordIndex, mockConfig);

            const match: KeywordMatch = {
                keyword: 'seo', // Canonical is 'seo'
                variations: ['seo', 'SEO', 'seos'],
                targetPost: mockTargetPost,
                priority: 1,
            };
            const context = 'This article discusses SEOs techniques.';

            // The keyword 'SEOs' is a variation, not the canonical keyword
            const score = (scanner as any).calculateRelevance('SEOs', match, context, mockSourcePost);
            expect(score).toBeCloseTo(0.4); // Only base score
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

            // This context contains 'ranking' and 'google', which are semantic keywords for the target post
            const richContext = 'This seo article talks about ranking on google.';
            const plainContext = 'This is an article about seo.';

            const richScore = (scanner as any).calculateRelevance('seo', match, richContext, mockSourcePost);
            const plainScore = (scanner as any).calculateRelevance('seo', match, plainContext, mockSourcePost);
            
            // richScore should have base (0.4) + exact_match (0.3) + semantic (0.15 * 2) = 1.0 (capped)
            // plainScore should have base (0.4) + exact_match (0.3) = 0.7
            expect(richScore).toBeGreaterThan(plainScore);
            expect(richScore).toBeCloseTo(1.0);
            expect(plainScore).toBeCloseTo(0.7);
        });
    });
});
