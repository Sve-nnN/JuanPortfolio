import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentScanner } from '../../../src/scripts/internal-linking/ContentScanner';
import type { PostMetadata, KeywordMatch, LinkingConfig } from '../../../src/scripts/internal-linking/types';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock file system
const TEST_DIR = path.resolve(process.cwd(), 'tmp-unit-test-content-scanner');

const createMockFile = async (filePath: string, content: string) => {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
};

describe('ContentScanner', () => {
    const mockConfig: LinkingConfig = {
        maxLinksPerKeyword: 3,
        minWordLength: 3,
        excludePatterns: [],
        dryRun: false,
        verbose: false,
    };

    beforeEach(async () => {
        await fs.rm(TEST_DIR, { recursive: true, force: true });
        await fs.mkdir(TEST_DIR, { recursive: true });
    });

    const getMockPost = (slug: string): PostMetadata => ({
        slug,
        title: slug,
        primary_keywords: ['seo'],
        category: 'tech-seo',
        filePath: path.join(TEST_DIR, `${slug}.md`),
        url: `/tech-seo/${slug}`,
        idioma: 'es',
        contentRole: 'satellite',
    });

    describe('blacklist and quality context', () => {
        it('should skip blacklisted keywords', async () => {
            const post = getMockPost('source');
            await createMockFile(post.filePath, '---\ntitle: test\n---\nComing soon to our blog.');
            
            const target = getMockPost('target');
            
            const keywordIndex = new Map<string, KeywordMatch>();
            keywordIndex.set('coming soon', {
                keyword: 'coming soon',
                variations: ['coming soon'],
                targetPost: target,
                priority: 1,
            });
            
            const scanner = new ContentScanner(keywordIndex, mockConfig);
            const ops = scanner.scanPost(post, [target]);
            expect(ops.length).toBe(0);
        });

        it('should skip keywords in poor quality context', async () => {
            const post = getMockPost('source');
            // Sentence < 6 words with 'coming'
            await createMockFile(post.filePath, '---\ntitle: test\n---\nEnglish version coming soon. seo');
            
            const target = getMockPost('target');
            const keywordIndex = new Map<string, KeywordMatch>();
            keywordIndex.set('seo', {
                keyword: 'seo',
                variations: ['seo'],
                targetPost: target,
                priority: 1,
            });
            
            const scanner = new ContentScanner(keywordIndex, mockConfig);
            const ops = scanner.scanPost(post, [target]);
            expect(ops.length).toBe(0); 
        });
    });

    describe('calculateRelevance', () => {
        it('should give a higher score for an exact primary keyword match', () => {
            const target = getMockPost('target');
            const scanner = new ContentScanner(new Map(), mockConfig);

            const match: KeywordMatch = {
                keyword: 'seo',
                variations: ['seo', 'SEOs'],
                targetPost: target,
                priority: 1,
            };
            const context = 'This article discusses seo techniques.';

            const exactScore = (scanner as any).calculateRelevance('seo', match, context, getMockPost('source'));
            const variationScore = (scanner as any).calculateRelevance('SEOs', match, context, getMockPost('source'));

            expect(exactScore).toBeGreaterThan(variationScore);
        });
    });
});
