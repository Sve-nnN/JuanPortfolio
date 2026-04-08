import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { KeywordExtractor } from '../../src/scripts/internal-linking/KeywordExtractor';
import { ContentScanner } from '../../src/scripts/internal-linking/ContentScanner';
import type { PostMetadata, LinkingConfig } from '../../src/scripts/internal-linking/types';

// Mock the fs module to avoid actual file system operations during tests
vi.mock('fs', async (importActual) => {
    const actual = await importActual<typeof fs>();
    return {
        ...actual,
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
        readdirSync: vi.fn(),
        existsSync: vi.fn(),
        statSync: vi.fn(() => ({ isDirectory: () => true })),
    };
});

// No custom mock for 'path' module for now. Use actual 'path' module.
// If needed, specific functions can be mocked granularly later.

// Mock getPostUrl
vi.mock('../../src/utilities/getPostUrl', () => ({
    getPostUrl: vi.fn(({ slug, categories }) => `/blog/${categories[0]}/${slug}`),
}));

describe('Internal Linking Logic', () => {
    const mockContentDir = 'mock-content-dir';
    const mockPostsDir = path.join(mockContentDir, 'posts');

    const mockPostFilePath1 = path.join(mockPostsDir, 'category1', 'post-a.md');
    const mockPostFilePath2 = path.join(mockPostsDir, 'category1', 'post-b.md');
    const mockPostFilePath3 = path.join(mockPostsDir, 'category2', 'post-c.md');
    const mockPostFilePath4 = path.join(mockPostsDir, 'category1', 'post-d.md'); // Post for semantic keyword generation test
    const mockPostFilePath5 = path.join(mockPostsDir, 'category1', 'post-e.md'); // Post for language mismatch test

    const mockPostContent1 = `---
title: Post A Title
primary_keywords: ["keyword one", "another keyword"]
semantic_keywords: ["related term a", "related phrase b"]
category: category1
idioma: en
---
This is the content of post A. It mentions keyword one and related term a.`;

    const mockPostContent2 = `---
title: Post B Title
primary_keywords: ["keyword two"]
semantic_keywords: ["another related term", "different phrase"]
category: category1
idioma: en
---
This is the content of post B. It talks about keyword two.
You should link to keyword one.`;

    const mockPostContent3 = `---
title: Post C Title
primary_keywords: ["keyword three"]
semantic_keywords: ["category two term"]
category: category2
idioma: en
---
Content for post C.
`;
    const mockPostContent4 = `---
title: Post D Title
primary_keywords: ["nlp test"]
category: category1
idioma: en
---
This post is about natural language processing and how it helps with text analysis.
It also talks about keyword one.`; // No semantic keywords in frontmatter

    const mockPostContent5 = `---
title: Post E Title (Spanish)
primary_keywords: ["palabra clave"]
semantic_keywords: ["termino relacionado"]
category: category1
idioma: es
---
Este es el contenido del post E. Menciona palabra clave.
`;


    const mockLinkingConfig: LinkingConfig = {
        maxLinksPerKeyword: 3,
        minWordLength: 3,
        excludePatterns: [/^```/, /^#{1,6}\s/, /^---$/, /^\s*[-*+]\s*$/],
        dryRun: true,
        verbose: false,
    };

    beforeEach(() => {
        // Reset all mocks before each test
        vi.clearAllMocks();

        // Setup mock file system structure
        (fs.readdirSync as vi.Mock).mockImplementation((dirPath) => {
            if (dirPath === path.join(mockContentDir, 'posts')) {
                return ['category1', 'category2'];
            }
            if (dirPath === path.join(mockPostsDir, 'category1')) {
                return ['post-a.md', 'post-b.md', 'post-d.md', 'post-e.md'];
            }
            if (dirPath === path.join(mockPostsDir, 'category2')) {
                return ['post-c.md'];
            }
            return [];
        });

        // Setup mock file content reading
        (fs.readFileSync as vi.Mock).mockImplementation((filePath) => {
            if (filePath === mockPostFilePath1) return mockPostContent1;
            if (filePath === mockPostFilePath2) return mockPostContent2;
            if (filePath === mockPostFilePath3) return mockPostContent3;
            if (filePath === mockPostFilePath4) return mockPostContent4;
            if (filePath === mockPostFilePath5) return mockPostContent5;
            return '';
        });

        // Ensure writeFileSync does nothing by default (for non-semantic keyword tests)
        (fs.writeFileSync as vi.Mock).mockImplementation(() => {});

        // Mock statSync to always return a directory for category checks
        (fs.statSync as vi.Mock).mockReturnValue({
            isDirectory: () => true,
        });
        (fs.existsSync as vi.Mock).mockReturnValue(true);
    });

    describe('KeywordExtractor', () => {
        it('should load posts and extract metadata correctly', async () => {
            const extractor = new KeywordExtractor(mockContentDir);
            const posts = await extractor.loadPosts();
            
            expect(posts.length).toBe(5);
            expect(posts[0].slug).toBe('post-a');
            expect(posts[0].primary_keywords).toEqual(['keyword one', 'another keyword']);
            expect(posts[0].semantic_keywords).toEqual(['related term a', 'related phrase b']);
            expect(posts[0].category).toBe('category1');
            expect(posts[0].idioma).toBe('en');
        });

        it('should generate semantic keywords if missing from frontmatter', async () => {
            const extractor = new KeywordExtractor(mockContentDir);
            await extractor.loadPosts(); // This will trigger parsePost for post-d.md

            // Verify writeFileSync was called for post-d.md
            expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
            const writtenContent = (fs.writeFileSync as vi.Mock).mock.calls[0][1];
            const { data } = matter(writtenContent);

            expect(data.semantic_keywords).toEqual(expect.arrayContaining([
                'natural language processing', 
            ]));
            expect(data.semantic_keywords.length).toBeGreaterThan(0);
            expect(data.semantic_keywords.length).toBeLessThanOrEqual(20);

        });

        it('should not regenerate semantic keywords if already present', async () => {
            // Setup fs.writeFileSync as a spy specifically for this test
            const writeFileSyncSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

            // Mock readFileSync to ensure only post-d is missing semantic keywords
            (fs.readFileSync as vi.Mock).mockImplementation((filePath) => {
                if (filePath.includes('post-a.md')) return mockPostContent1; // Has semantic keywords
                if (filePath.includes('post-b.md')) return mockPostContent2; // Has semantic keywords
                if (filePath.includes('post-c.md')) return mockPostContent3; // Has semantic keywords
                if (filePath.includes('post-d.md')) return mockPostContent4; // MISSING semantic keywords
                if (filePath.includes('post-e.md')) return mockPostContent5; // Has semantic keywords
                return '';
            });
            
            const extractor = new KeywordExtractor(mockContentDir);
            await extractor.loadPosts();

            // Only post-d should have triggered writeFileSync
            expect(writeFileSyncSpy).toHaveBeenCalledTimes(1); 
            const writtenContent = writeFileSyncSpy.mock.calls[0][1];
            const { data } = matter(writtenContent);
            expect(data.semantic_keywords).toEqual(expect.arrayContaining([
                'natural language processing', 
            ]));
            expect(data.semantic_keywords.length).toBeGreaterThan(0);
            expect(data.semantic_keywords.length).toBeLessThanOrEqual(20);
            writeFileSyncSpy.mockRestore(); // Clean up the spy
        });

        it('should build keyword index correctly including primary and semantic', async () => {
            const extractor = new KeywordExtractor(mockContentDir);
            await extractor.loadPosts();
            const index = extractor.buildIndex();

            expect(index.has('keyword one')).toBe(true);
            expect(index.get('keyword one')?.targetPost.slug).toBe('post-a');
            
            // Check a semantic keyword from post-a
            expect(index.has('related term a')).toBe(true);
            expect(index.get('related term a')?.targetPost.slug).toBe('post-a');

            // Check a primary keyword from post-b
            expect(index.has('keyword two')).toBe(true);
            expect(index.get('keyword two')?.targetPost.slug).toBe('post-b');
        });

        it('should generate variations using pluralize', async () => {
            // Test singular of plural keyword
            vi.clearAllMocks(); // Start with a clean slate
            (fs.readdirSync as vi.Mock).mockImplementation((dirPath) => {
                if (dirPath === path.join(mockContentDir, 'posts')) return ['category1'];
                if (dirPath === path.join(mockPostsDir, 'category1')) return ['post-a.md'];
                return [];
            });
            (fs.readFileSync as vi.Mock).mockImplementation((filePath) => {
                if (filePath === mockPostFilePath1) {
                    return mockPostContent1.replace('primary_keywords: ["keyword one", "another keyword"]', 'primary_keywords: ["keywords"]');
                }
                return '';
            });

            const extractor1 = new KeywordExtractor(mockContentDir);
            await extractor1.loadPosts();
            const index1 = extractor1.buildIndex();
            expect(index1.has('keyword')).toBe(true); // Singular of "keywords"
            expect(index1.get('keyword')?.targetPost.slug).toBe('post-a');
            expect(index1.has('keywords')).toBe(true); // Original plural form
            expect(index1.get('keywords')?.targetPost.slug).toBe('post-a');

            // Test plural of singular keyword
            vi.clearAllMocks(); // Clear mocks for a fresh run
            (fs.readdirSync as vi.Mock).mockImplementation((dirPath) => {
                if (dirPath === path.join(mockContentDir, 'posts')) return ['category1'];
                if (dirPath === path.join(mockPostsDir, 'category1')) return ['post-b.md']; // Use post-b for this test to avoid re-writing logic
                return [];
            });
            (fs.readFileSync as vi.Mock).mockImplementation((filePath) => {
                if (filePath === mockPostFilePath2) { // Using mockPostFilePath2 for post-b
                    return mockPostContent2.replace('primary_keywords: ["keyword two"]', 'primary_keywords: ["singular keyword"]');
                }
                return '';
            });

            const extractor2 = new KeywordExtractor(mockContentDir);
            await extractor2.loadPosts();
            const index2 = extractor2.buildIndex();
            expect(index2.has('singular keyword')).toBe(true); // Original singular form
            expect(index2.get('singular keyword')?.targetPost.slug).toBe('post-b');
            expect(index2.has('singular keywords')).toBe(true); // Plural of "singular keyword"
            expect(index2.get('singular keywords')?.targetPost.slug).toBe('post-b');
        });

        it('should validate keyword language, skipping mismatched primary keywords', async () => {
            vi.clearAllMocks(); // Start with a clean slate
            const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            // Setup mock file system for only post-e.md
            (fs.readdirSync as vi.Mock).mockImplementation((dirPath) => {
                if (dirPath === path.join(mockContentDir, 'posts')) return ['category1'];
                if (dirPath === path.join(mockPostsDir, 'category1')) return ['post-e.md'];
                return [];
            });

            // Content for post-e.md with a mismatched English primary keyword
            const mixedLangPostContent = `---
title: Mixed Language Post
primary_keywords: ["english keyword"]
category: category1
idioma: es
---
Some Spanish content.`;
            (fs.readFileSync as vi.Mock).mockImplementation((filePath) => {
                if (filePath === mockPostFilePath5) return mixedLangPostContent;
                return '';
            });

            const extractor = new KeywordExtractor(mockContentDir);
            const posts = await extractor.loadPosts();

            expect(posts.length).toBe(1);
            expect(posts[0].slug).toBe('post-e');
            expect(posts[0].primary_keywords).not.toContain('english keyword'); // Should be filtered out
            expect(spy).toHaveBeenCalledWith(expect.stringContaining("Language Mismatch"));
            spy.mockRestore();
        });

        it('should validate keyword language, skipping mismatched semantic keywords', async () => {
            vi.clearAllMocks(); // Start with a clean slate
            const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        
            // Setup mock file system for only post-e.md
            (fs.readdirSync as vi.Mock).mockImplementation((dirPath) => {
                if (dirPath === path.join(mockContentDir, 'posts')) return ['category1'];
                if (dirPath === path.join(mockPostsDir, 'category1')) return ['post-e.md'];
                return [];
            });

            // Content for post-e.md with a mismatched English semantic keyword
            const mixedLangPostContent = `---
title: Mixed Language Post
primary_keywords: ["palabra clave"]
semantic_keywords: ["english semantic term"]
category: category1
idioma: es
---
Some Spanish content.`;
            (fs.readFileSync as vi.Mock).mockImplementation((filePath) => {
                if (filePath === mockPostFilePath5) return mixedLangPostContent;
                return '';
            });
        
            const extractor = new KeywordExtractor(mockContentDir);
            const posts = await extractor.loadPosts();

            expect(posts.length).toBe(1);
            expect(posts[0].slug).toBe('post-e');
            expect(posts[0].semantic_keywords).not.toContain('english semantic term'); // Should be filtered out
            expect(spy).toHaveBeenCalledWith(expect.stringContaining("Language Mismatch"));
            spy.mockRestore();
        });
    });

    describe('ContentScanner', () => {
        let extractor: KeywordExtractor;
        let posts: PostMetadata[];
        let keywordIndex: Map<string, KeywordMatch>;

        beforeEach(async () => {
            // Need to reload posts and build index for scanner tests
            extractor = new KeywordExtractor(mockContentDir);
            posts = await extractor.loadPosts();
            keywordIndex = extractor.buildIndex();
            // Ensure writeFileSync is mocked so that semantic keyword generation doesn't interfere
            (fs.writeFileSync as vi.Mock).mockImplementation(() => {}); 
        });

        it('should find linking opportunities within the same category', () => {
            const scanner = new ContentScanner(keywordIndex, mockLinkingConfig);
            // Scan post-b, which mentions "keyword one" (owned by post-a in category1)
            const opportunities = scanner.scanPost(posts[1], posts); // posts[1] is post-b

            expect(opportunities.length).toBeGreaterThan(0);
            const op = opportunities.find(o => o.keyword === 'keyword one' || o.keyword === 'keyword one.');
            expect(op).toBeDefined();
            expect(op?.sourcePost.slug).toBe('post-b');
            expect(op?.targetPost.slug).toBe('post-a');
            expect(op?.targetPost.category).toBe(op?.sourcePost.category); // Crucial: same category
        });

        it('should NOT find linking opportunities between different categories', () => {
            const scanner = new ContentScanner(keywordIndex, mockLinkingConfig);
            const spy = vi.spyOn(console, 'log').mockImplementation(() => {}); // Capture verbose output

            // Scan post-b (category1) for opportunities. It should NOT find links to post-c (category2) even if content matched.
            const opportunities = scanner.scanPost(posts[1], posts); // posts[1] is post-b

            // Check if post-c (category2) primary keywords ("keyword three") are present in post-b
            // If they were, they should be explicitly skipped.
            // For this test, we'll assume there might be a mention, but ensure no opportunity is created.
            // We need to modify mockPostContent2 to explicitly mention "keyword three"
            (fs.readFileSync as vi.Mock).mockImplementation((filePath) => {
                if (filePath === mockPostFilePath2) return mockPostContent2 + ' It also talks about keyword three.';
                if (filePath === mockPostFilePath1) return mockPostContent1;
                if (filePath === mockPostFilePath3) return mockPostContent3;
                if (filePath === mockPostFilePath4) return mockPostContent4;
                if (filePath === mockPostFilePath5) return mockPostContent5;
                return '';
            });

            // Re-initialize and rescan
            // This is a bit tricky with mocks. Better to test the internal logic directly or with dedicated mock content.
            // For now, rely on the console.log output for verbose mode.
            const configWithVerbose = { ...mockLinkingConfig, verbose: true };
            const scannerVerbose = new ContentScanner(keywordIndex, configWithVerbose);
            scannerVerbose.scanPost(posts[1], posts); // posts[1] is post-b

            expect(spy).toHaveBeenCalledWith(expect.stringContaining("Skipping link from post-b to post-c: different categories (category1 != category2)"));
            spy.mockRestore();

            const op = opportunities.find(o => o.targetPost.slug === 'post-c');
            expect(op).not.toBeDefined(); // No opportunity should be found for post-c
        });

        it('should skip linking to self', () => {
            const scanner = new ContentScanner(keywordIndex, mockLinkingConfig);
            // Scan post-a. It mentions "keyword one" but should not link to itself.
            const opportunities = scanner.scanPost(posts[0], posts); // posts[0] is post-a
            const op = opportunities.find(o => o.targetPost.slug === 'post-a');
            expect(op).not.toBeDefined();
        });

        it('should skip existing links', () => {
            const postWithExistingLinkContent = `---
title: Post X Title
primary_keywords: ["existing link test"]
category: category1
idioma: en
---
This content has an [existing link](/blog/category1/post-a). It also mentions keyword one.`;
            (fs.readFileSync as vi.Mock).mockImplementation((filePath) => {
                if (filePath === mockPostFilePath1) return postWithExistingLinkContent; // Mock post-a content
                return mockPostContent1; // Fallback for other files
            });

            const extractorX = new KeywordExtractor(mockContentDir);
            const postsX = [
                {
                    slug: 'post-x',
                    title: 'Post X Title',
                    primary_keywords: ['existing link test'],
                    semantic_keywords: [],
                    category: 'category1',
                    filePath: mockPostFilePath1,
                    url: '/blog/category1/post-x',
                    idioma: 'en',
                } as PostMetadata,
                ...posts.slice(1)
            ];
            const keywordIndexX = extractorX.buildIndex(); // Rebuild index with post-x
            
            // Need to update the mock for getPostUrl to handle post-x mapping to post-a's filePath
            (fs.readFileSync as vi.Mock).mockImplementation((filePath) => {
                if (filePath === mockPostFilePath1) return postWithExistingLinkContent; // content for post-x
                if (filePath === mockPostFilePath2) return mockPostContent2; // content for post-b
                if (filePath === mockPostFilePath3) return mockPostContent3; // content for post-c
                if (filePath === mockPostFilePath4) return mockPostContent4; // content for post-d
                if (filePath === mockPostFilePath5) return mockPostContent5; // content for post-e
                return '';
            });

            const scanner = new ContentScanner(keywordIndexX, mockLinkingConfig);
            const opportunities = scanner.scanPost(postsX[0], postsX); // Scan post-x

            // It mentions "keyword one" which links to post-a, but there's an existing link to post-a
            const op = opportunities.find(o => o.targetPost.slug === 'post-a');
            expect(op).not.toBeDefined();
        });

        it('should identify content gaps correctly', async () => {
            vi.clearAllMocks(); // Start with a clean slate for this isolated test

            // Setup mock file system structure to load only relevant posts for this test
            (fs.readdirSync as vi.Mock).mockImplementation((dirPath) => {
                if (dirPath === path.join(mockContentDir, 'posts')) {
                    return ['category1'];
                }
                if (dirPath === path.join(mockPostsDir, 'category1')) {
                    return ['post-a.md', 'post-b.md']; // Only need these two for the test
                }
                return [];
            });

            // Mock content for post-a.md and post-b.md for this test
            const postAContentWithUncoveredKeyword = `---
title: Post A Title
primary_keywords: ["keyword one", "another keyword"]
semantic_keywords: ["related term a", "related phrase b", "uncovered keyword"]
category: category1
idioma: en
---
This is the content of post A. It mentions keyword one and related term a. Uncovered keyword. Uncovered keyword.`;

            const postBContentWithUncoveredKeywordMention = `---
title: Post B Title
primary_keywords: ["keyword two"]
semantic_keywords: ["another related term", "different phrase"]
category: category1
idioma: en
---
This is the content of post B. It talks about keyword two. Another mention of uncovered keyword.`;

            (fs.readFileSync as vi.Mock).mockImplementation((filePath) => {
                if (filePath === mockPostFilePath1) return postAContentWithUncoveredKeyword;
                if (filePath === mockPostFilePath2) return postBContentWithUncoveredKeywordMention;
                return '';
            });

            // Re-create extractor and load posts with the specific content
            extractor = new KeywordExtractor(mockContentDir);
            const loadedPosts = await extractor.loadPosts(); // This will process the mocked content
            keywordIndex = extractor.buildIndex();
            
            // Explicitly ensure that "uncovered keyword" is NOT a primary keyword for any loaded post
            expect(loadedPosts.some(p => p.primary_keywords.includes('uncovered keyword'))).toBe(false);

            const scanner = new ContentScanner(keywordIndex, mockLinkingConfig);
            const contentGaps = scanner.findContentGaps(loadedPosts);
            
            expect(contentGaps.has('uncovered keyword')).toBe(true);
            const gap = contentGaps.get('uncovered keyword');
            expect(gap?.count).toBe(3); // Mentioned twice in post-a, once in post-b
            expect(gap?.sources).toEqual(new Set(['post-a', 'post-b']));
            expect(gap?.category).toBe('category1'); // The category of one of the mentioning posts
        });
    });
});
