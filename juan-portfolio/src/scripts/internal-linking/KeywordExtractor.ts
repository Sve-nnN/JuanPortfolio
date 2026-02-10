import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import type { PostMetadata, KeywordMatch } from './types';
import { getPostUrl } from '../../utilities/getPostUrl';

/**
 * Extracts keywords from posts and builds a keyword-to-post index.
 *
 * This class is responsible for:
 * - Loading post metadata from markdown files
 * - Extracting primary and semantic keywords from frontmatter
 * - Generating variations (plural, singular, case-insensitive)
 * - Building a searchable keyword index based on primary keywords
 */
export class KeywordExtractor {
    private keywordIndex: Map<string, KeywordMatch> = new Map();
    private posts: PostMetadata[] = [];

    constructor(private contentDir: string) {}

    /**
     * Load all posts from the content directory.
     */
    async loadPosts(category?: string): Promise<PostMetadata[]> {
        const postsDir = path.join(this.contentDir, 'posts');
        this.posts = [];

        const args = process.argv.slice(2);
        const includeTest = args.includes('--include-test');

        const categories = category
            ? [category]
            : fs.readdirSync(postsDir).filter(f => {
                  const stat = fs.statSync(path.join(postsDir, f));
                  // Skip 'test' directory unless explicitly requested
                  if (f === 'test' && !includeTest) {
                      return false;
                  }
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
     * Parse a single post file and extract metadata and keywords.
     */
    private parsePost(filePath: string, category: string): PostMetadata | null {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const { data } = matter(content);

            const slug = path.basename(filePath, '.md');
            const url = getPostUrl({ slug, categories: [category] });

            const primary_keywords: string[] = (data.primary_keywords || []).map((kw: string) => kw.toLowerCase());
            const semantic_keywords: string[] = (data.semantic_keywords || []).map((kw: string) => kw.toLowerCase());

            return {
                slug,
                title: data.title || slug,
                primary_keywords,
                semantic_keywords,
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
     * Build keyword index mapping primary keywords to target posts.
     * Each keyword will link to one definitive post.
     */
    buildIndex(): Map<string, KeywordMatch> {
        this.keywordIndex.clear();

        for (const post of this.posts) {
            for (const keyword of post.primary_keywords) {
                const variations = this.generateVariations(keyword);

                // Check for keyword cannibalization
                if (this.keywordIndex.has(keyword) && this.keywordIndex.get(keyword)!.targetPost.slug !== post.slug) {
                    console.warn(
                        `⚠️  Keyword Cannibalization Warning: The keyword "${keyword}" is claimed by both '${
                            this.keywordIndex.get(keyword)!.targetPost.slug
                        }' and '${post.slug}'. The first one found will be used.`,
                    );
                    continue; // Skip re-assigning this keyword
                }

                const match: KeywordMatch = {
                    keyword,
                    variations,
                    targetPost: post,
                    priority: 1, // Priority is now simplified
                };

                // Index both the primary keyword and all its variations
                variations.forEach(v => {
                    if (!this.keywordIndex.has(v)) {
                        this.keywordIndex.set(v, match);
                    }
                });
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
