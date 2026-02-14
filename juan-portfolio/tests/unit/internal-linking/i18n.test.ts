import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ContentScanner } from '../../../src/scripts/internal-linking/ContentScanner';
import { KeywordExtractor } from '../../../src/scripts/internal-linking/KeywordExtractor';
import type { PostMetadata, KeywordMatch, LinkingConfig } from '../../../src/scripts/internal-linking/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Internal Linking i18n', () => {
    let tmpDir: string;

    const mockConfig: LinkingConfig = {
        maxLinksPerKeyword: 3,
        minWordLength: 3,
        excludePatterns: [],
        dryRun: false,
        verbose: false,
    };

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'internal-linking-test-'));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    const createMockPostFile = (slug: string, idioma: string, primary: string[], semantic: string[] = []) => {
        const filePath = path.join(tmpDir, `${slug}.md`);
        const content = `---
title: ${slug}
idioma: ${idioma}
primary_keywords: [${primary.map(k => `"${k}"`).join(', ')}]
semantic_keywords: [${semantic.map(k => `"${k}"`).join(', ')}]
---
Content for ${slug}`;
        fs.writeFileSync(filePath, content);
        return filePath;
    };

    it('should NOT link an English post to a Spanish post even if keywords match', () => {
        const filePathEN = createMockPostFile('post-en', 'en', ['technical seo']);
        const postEN: PostMetadata = {
            slug: 'post-en',
            title: 'post-en',
            primary_keywords: ['technical seo'],
            category: 'test',
            filePath: filePathEN,
            url: '/post-en',
            idioma: 'en',
        };

        const postES: PostMetadata = {
            slug: 'post-es',
            title: 'post-es',
            primary_keywords: ['seo tecnico'],
            category: 'test',
            filePath: '/path/to/post-es.md',
            url: '/post-es',
            idioma: 'es',
        };

        // Update post-en content to mention Spanish keyword
        fs.writeFileSync(filePathEN, `---
title: post-en
idioma: en
---
This post mentions seo tecnico.`);

        const keywordIndex = new Map<string, KeywordMatch>();
        keywordIndex.set('seo tecnico', {
            keyword: 'seo tecnico',
            variations: ['seo tecnico'],
            targetPost: postES,
            priority: 1,
        });

        const scanner = new ContentScanner(keywordIndex, mockConfig);
        const opportunities = scanner.scanPost(postEN, [postEN, postES]);
        
        expect(opportunities.length).toBe(0);
    });

    it('should link an English post to another English post', () => {
        const filePathEN = createMockPostFile('post-en', 'en', ['technical seo']);
        const postEN: PostMetadata = {
            slug: 'post-en',
            title: 'post-en',
            primary_keywords: ['technical seo'],
            category: 'test',
            filePath: filePathEN,
            url: '/post-en',
            idioma: 'en',
        };

        const postEN2: PostMetadata = {
            slug: 'post-en-2',
            title: 'post-en-2',
            primary_keywords: ['nextjs'],
            category: 'test',
            filePath: '/path/to/post-en-2.md',
            url: '/post-en-2',
            idioma: 'en',
        };

        // Update post-en content to mention English keyword
        fs.writeFileSync(filePathEN, `---
title: post-en
idioma: en
---
This post mentions nextjs.`);

        const keywordIndex = new Map<string, KeywordMatch>();
        keywordIndex.set('nextjs', {
            keyword: 'nextjs',
            variations: ['nextjs'],
            targetPost: postEN2,
            priority: 1,
        });

        const scanner = new ContentScanner(keywordIndex, mockConfig);
        const opportunities = scanner.scanPost(postEN, [postEN, postEN2]);
        
        expect(opportunities.length).toBe(1);
        expect(opportunities[0].targetPost.slug).toBe('post-en-2');
    });

    it('should filter out Spanish keywords from an English post during extraction', async () => {
        const postsDir = path.join(tmpDir, 'posts', 'test');
        fs.mkdirSync(postsDir, { recursive: true });
        
        const filePath = path.join(postsDir, 'post-en.md');
        fs.writeFileSync(filePath, `---
title: post-en
idioma: en
primary_keywords: ["technical seo", "guia de seo"]
semantic_keywords: ["seo tips", "como hacer seo"]
---
Content`);

        const extractor = new KeywordExtractor(tmpDir);
        const posts = await extractor.loadPosts('test');
        
        expect(posts.length).toBe(1);
        const post = posts[0];
        
        expect(post.primary_keywords).toContain('technical seo');
        expect(post.primary_keywords).not.toContain('guia de seo');
        
        expect(post.semantic_keywords).toContain('seo tips');
        expect(post.semantic_keywords).not.toContain('como hacer seo');
    });

    it('should filter out English keywords from a Spanish post during extraction', async () => {
        const postsDir = path.join(tmpDir, 'posts', 'test');
        fs.mkdirSync(postsDir, { recursive: true });
        
        const filePath = path.join(postsDir, 'post-es.md');
        fs.writeFileSync(filePath, `---
title: post-es
idioma: es
primary_keywords: ["seo tecnico", "technical seo guide"]
semantic_keywords: ["consejos seo", "how to do seo"]
---
Contenido`);

        const extractor = new KeywordExtractor(tmpDir);
        const posts = await extractor.loadPosts('test');
        
        expect(posts.length).toBe(1);
        const post = posts[0];
        
        expect(post.primary_keywords).toContain('seo tecnico');
        expect(post.primary_keywords).not.toContain('technical seo guide');
        
        expect(post.semantic_keywords).toContain('consejos seo');
        expect(post.semantic_keywords).not.toContain('how to do seo');
    });
});
