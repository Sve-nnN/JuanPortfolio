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
            const idioma = data.idioma || 'en';

            const primary_keywords: string[] = (data.primary_keywords || [])
                .map((kw: string) => kw.toLowerCase())
                .filter((kw: string) => this.validateKeywordLanguage(kw, idioma, slug, 'primary'));

            const semantic_keywords: string[] = (data.semantic_keywords || [])
                .map((kw: string) => kw.toLowerCase())
                .filter((kw: string) => this.validateKeywordLanguage(kw, idioma, slug, 'semantic'));

            // Authority Cluster Logic
            const clusterType = (data.clusterType as 'Pillar' | 'Supporting') || 
                                (primary_keywords.length > 2 || /guide|guia|manual/i.test(data.title || slug) ? 'Pillar' : 'Supporting');
            const contentType = (data.contentType as 'Blog' | 'Guide' | 'Case Study') || 'Blog';

            return {
                slug,
                title: data.title || slug,
                primary_keywords,
                semantic_keywords,
                category,
                filePath,
                url,
                idioma,
                clusterType,
                contentType,
            };
        } catch (error) {
            console.error(`Error parsing ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Validates that a keyword's language matches the post language.
     * Technical terms in English are allowed in Spanish posts if they don't contain common English stop words.
     */
    private validateKeywordLanguage(keyword: string, idioma: string, slug: string, type: string): boolean {
        const enStopWords = new Set(['the', 'a', 'an', 'of', 'for', 'and', 'or', 'is', 'are', 'with', 'from', 'to', 'how', 'why', 'what', 'who', 'best', 'guide', 'tutorial']);
        const esStopWords = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'y', 'o', 'en', 'por', 'para', 'que', 'con', 'como', 'donde', 'quien', 'mejor', 'guia', 'tutoriales']);

        const words = keyword.toLowerCase().split(/\s+/);
        
        if (idioma === 'es') {
            // Check if Spanish post has clearly English keywords (at least 2 EN stop words or starts with EN stop word in long phrase)
            const enStopCount = words.filter(w => enStopWords.has(w)).length;
            if (enStopCount >= 2 || (words.length > 2 && enStopWords.has(words[0]))) {
                console.warn(`⚠️  Language Mismatch in '${slug}': ${type} keyword "${keyword}" looks English but post is Spanish (es). skipping...`);
                return false;
            }
        } else if (idioma === 'en') {
            // Check if English post has clearly Spanish keywords
            const esStopCount = words.filter(w => esStopWords.has(w)).length;
            // "big o notation" has "o" which is an ES stop word. We should allow it.
            // Only block if 2+ ES stop words or clearly ES grammar.
            if (esStopCount >= 2 || (words.length > 2 && esStopWords.has(words[0]))) {
                console.warn(`⚠️  Language Mismatch in '${slug}': ${type} keyword "${keyword}" looks Spanish but post is English (en). skipping...`);
                return false;
            }
        }

        return true;
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
                    priority: post.clusterType === 'Pillar' ? 2 : 1, 
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
