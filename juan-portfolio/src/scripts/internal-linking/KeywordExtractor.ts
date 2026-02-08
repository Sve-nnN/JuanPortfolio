import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import type { PostMetadata, KeywordMatch } from './types';

/**
 * Extracts keywords from posts and builds a keyword-to-post index.
 * 
 * This class is responsible for:
 * - Loading post metadata from markdown files
 * - Extracting keywords from frontmatter and headings
 * - Generating semantic variations (plural, singular, case-insensitive)
 * - Building a searchable keyword index
 */
export class KeywordExtractor {
    private keywordIndex: Map<string, KeywordMatch> = new Map();
    private posts: PostMetadata[] = [];

    constructor(private contentDir: string) { }

    /**
     * Load all posts from the content directory.
     */
    async loadPosts(category?: string): Promise<PostMetadata[]> {
        const postsDir = path.join(this.contentDir, 'posts');
        this.posts = [];

        const categories = category
            ? [category]
            : fs.readdirSync(postsDir).filter(f => {
                const stat = fs.statSync(path.join(postsDir, f));
                return stat.isDirectory();
            });

        for (const cat of categories) {
            const categoryDir = path.join(postsDir, cat);
            if (!fs.existsSync(categoryDir)) continue;

            const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.md'));

            for (const file of files) {
                const filePath = path.join(categoryDir, file);
                const post = this.parsePost(filePath, cat);
                if (post) {
                    this.posts.push(post);
                }
            }
        }

        return this.posts;
    }

    /**
     * Parse a single post file and extract metadata.
     */
    private parsePost(filePath: string, category: string): PostMetadata | null {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const { data } = matter(content);

            const slug = path.basename(filePath, '.md');
            const url = `/${category}/${slug}`;

            return {
                slug,
                title: data.title || slug,
                keywords: this.extractKeywords(data, content),
                category,
                filePath,
                url,
            };
        } catch (error) {
            console.error(`Error parsing ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Extract keywords from frontmatter and content.
     */
    private extractKeywords(frontmatter: any, content: string): string[] {
        const keywords: Set<string> = new Set();

        // From frontmatter
        if (frontmatter.keywords && Array.isArray(frontmatter.keywords)) {
            frontmatter.keywords.forEach((kw: string) => keywords.add(kw.toLowerCase()));
        }

        // From relatedPosts (extract topic from slugs)
        if (frontmatter.relatedPosts && Array.isArray(frontmatter.relatedPosts)) {
            frontmatter.relatedPosts.forEach((slug: string) => {
                // Extract meaningful keywords from slug (e.g., 'nextjs-seo-optimization' -> 'nextjs', 'seo', 'optimization')
                const words = slug.split('-').filter(w => w.length > 3);
                words.forEach(w => keywords.add(w.toLowerCase()));
            });
        }

        // Extract from H2 headings as secondary keywords
        const h2Regex = /^##\s+(.+)$/gm;
        let match;
        while ((match = h2Regex.exec(content)) !== null) {
            const heading = match[1].trim();
            // Remove markdown formatting
            const cleaned = heading.replace(/[*_`[\]()]/g, '').toLowerCase();
            if (cleaned.length > 5 && cleaned.length < 50) {
                keywords.add(cleaned);
            }
        }

        return Array.from(keywords);
    }

    /**
     * Build keyword index mapping keywords to target posts.
     * Each keyword will link to the most relevant post (based on priority).
     */
    buildIndex(): Map<string, KeywordMatch> {
        this.keywordIndex.clear();

        for (const post of this.posts) {
            for (let i = 0; i < post.keywords.length; i++) {
                const keyword = post.keywords[i];
                const priority = post.keywords.length - i; // Earlier keywords = higher priority

                const variations = this.generateVariations(keyword);

                // Use the keyword that appears first in the post's keyword list
                if (!this.keywordIndex.has(keyword) || this.keywordIndex.get(keyword)!.priority < priority) {
                    const match: KeywordMatch = {
                        keyword,
                        variations,
                        targetPost: post,
                        priority,
                    };

                    // Index both the primary keyword and all variations
                    this.keywordIndex.set(keyword, match);
                    variations.forEach(v => {
                        if (!this.keywordIndex.has(v)) {
                            this.keywordIndex.set(v, match);
                        }
                    });
                }
            }
        }

        return this.keywordIndex;
    }

    /**
     * Generate semantic variations of a keyword.
     * Handles plural/singular, case variations, and hyphenated forms.
     */
    private generateVariations(keyword: string): string[] {
        const variations = new Set<string>();

        // Original
        variations.add(keyword.toLowerCase());

        // Capitalize first letter
        variations.add(keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase());

        // All uppercase
        variations.add(keyword.toUpperCase());

        // Plural forms (simple heuristic)
        if (!keyword.endsWith('s')) {
            variations.add(keyword + 's');
            variations.add((keyword.charAt(0).toUpperCase() + keyword.slice(1)) + 's');
        }

        // Singular forms (remove trailing 's')
        if (keyword.endsWith('s') && keyword.length > 3) {
            const singular = keyword.slice(0, -1);
            variations.add(singular);
            variations.add(singular.charAt(0).toUpperCase() + singular.slice(1));
        }

        // Handle hyphenated keywords (create space-separated version)
        if (keyword.includes('-')) {
            const spaced = keyword.replace(/-/g, ' ');
            variations.add(spaced);
            variations.add(spaced.charAt(0).toUpperCase() + spaced.slice(1));
        }

        // Handle space-separated keywords (create hyphenated version)
        if (keyword.includes(' ')) {
            const hyphenated = keyword.replace(/\s+/g, '-');
            variations.add(hyphenated);
        }

        return Array.from(variations);
    }

    /**
     * Get the keyword index.
     */
    getIndex(): Map<string, KeywordMatch> {
        return this.keywordIndex;
    }

    /**
     * Get all loaded posts.
     */
    getPosts(): PostMetadata[] {
        return this.posts;
    }
}
