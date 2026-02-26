import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import natural from 'natural';
import pluralize from 'pluralize';
import type { PostMetadata, KeywordMatch } from './types';
import { getPostUrl } from '../../utilities/getPostUrl';

// Initialize NLP components
const tokenizer = new natural.WordTokenizer();
const nounInflector = new natural.NounInflector();
const stopWords = new Set(natural.stopwords);

// Extended English stop words for better filtering of technical/SEO terms
const enExtendedStopWords = new Set([...natural.stopwords, 'guide', 'tutorial', 'how', 'what', 'why', 'best', 'review', 'vs', 'comparison', 'vs.', 'english', 'term', 'phrase', 'keyword', 'word', 'example', 'case', 'study', 'data', 'analysis']);
const esExtendedStopWords = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'y', 'o', 'en', 'por', 'para', 'que', 'con', 'como', 'donde', 'quien', 'mejor', 'guia', 'tutoriales', 'es', 'son', 'ser', 'estar']);

/**
 * Extracts keywords from posts and builds a keyword-to-post index.
 *
 * This class is responsible for:
 * - Loading post metadata from markdown files
 * - Extracting primary and semantic keywords from frontmatter
 * - Generating variations (plural, singular, case-insensitive)
 * - Building a searchable keyword index based on primary keywords
 * - Generating semantic keywords using NLP if not present in frontmatter
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

            const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.md') && !f.endsWith('.json'));

            for (const file of files) {
                const filePath = path.join(categoryDir, file);
                const post = this.parsePost(filePath, cat); // parsePost now handles semantic keyword generation
                if (post) {
                    this.posts.push(post);
                }
            }
        }

        return this.posts;
    }

    /**
     * Parse a single post file and extract metadata and keywords.
     * Generates semantic keywords using NLP if not explicitly defined in frontmatter.
     */
    private parsePost(filePath: string, category: string): PostMetadata | null {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const { data, content } = matter(fileContent);

            // Strip locale suffix (.en.md, .es.md) then the plain .md extension
            const basename = path.basename(filePath)
            const slug = basename.replace(/\.(en|es)\.md$/, '').replace(/\.md$/, '')

            // Locale: filename suffix wins, then frontmatter, then site default 'es'
            const idioma: 'en' | 'es' = basename.endsWith('.en.md') ? 'en'
                : basename.endsWith('.es.md') ? 'es'
                : ((data.idioma as 'en' | 'es') || 'es')

            const relativeUrl = getPostUrl({ slug, categories: [category] }, idioma);
            const url = `https://juan-tech.com${relativeUrl}`;

            const primary_keywords: string[] = (data.primary_keywords || [])
                .map((kw: string) => kw.toLowerCase())
                .filter((kw: string) => this.validateKeywordLanguage(kw, idioma, slug, 'primary'));
            
            let semantic_keywords: string[] = (data.semantic_keywords || [])
                .map((kw: string) => kw.toLowerCase())
                .filter((kw: string) => this.validateKeywordLanguage(kw, idioma, slug, 'semantic'));

            // Generate semantic keywords if not present (undefined or null) in frontmatter
            if (data.semantic_keywords === undefined || data.semantic_keywords === null) {
                const generatedSemanticKeywords = this.generateSemanticKeywords(content, idioma);
                semantic_keywords = [...new Set([...semantic_keywords, ...generatedSemanticKeywords])]; // Deduplicate
                
                // Update frontmatter with generated semantic keywords
                const newData = { ...data, semantic_keywords: Array.from(new Set(semantic_keywords)) };
                const newContent = matter.stringify(content, newData);
                fs.writeFileSync(filePath, newContent);
                console.log(`✨ Generated semantic keywords for ${slug}`);
            }

            // Content role: explicit frontmatter wins, then legacy clusterType, then heuristic
            const contentRole: import('./types').ContentRole =
                data.contentRole ||
                (data.clusterType === 'Pillar' ? 'pillar' : undefined) ||
                (primary_keywords.length > 2 || /guide|guia|manual/i.test(data.title || slug) ? 'pillar' : 'satellite')

            // Legacy clusterType kept for backward-compat scoring
            const clusterType = (data.clusterType as 'Pillar' | 'Supporting') ||
                (contentRole === 'pillar' ? 'Pillar' : 'Supporting')
            const contentType = (data.contentType as 'Blog' | 'Guide' | 'Case Study') || 'Blog'

            return {
                slug,
                title: data.title || slug,
                primary_keywords,
                semantic_keywords,
                category,
                filePath,
                url,
                idioma,
                contentRole,
                pillarSlug: data.pillarSlug as string | undefined,
                clusterType,
                contentType,
            };
        } catch (error) {
            console.error(`Error parsing ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Generates semantic keywords (potential anchor texts) from post content using NLP.
     * Focuses on noun phrases and relevant terms.
     */
    private generateSemanticKeywords(text: string, idioma: string): string[] {
        const keywords = new Set<string>();
        const tokens = tokenizer.tokenize(text.toLowerCase());
        const filteredTokens = tokens.filter(token => {
            const isStopWord = idioma === 'es' ? esExtendedStopWords.has(token) : enExtendedStopWords.has(token);
            return token.length > 2 && !isStopWord; // Filter out short words and stop words
        });

        // Simple N-gram approach for noun phrases (up to 3 words)
        for (let i = 0; i < filteredTokens.length; i++) {
            // Single words
            keywords.add(filteredTokens[i]);

            // Two-word phrases
            if (i + 1 < filteredTokens.length) {
                const phrase2 = `${filteredTokens[i]} ${filteredTokens[i + 1]}`;
                keywords.add(phrase2);
            }

            // Three-word phrases
            if (i + 2 < filteredTokens.length) {
                const phrase3 = `${filteredTokens[i]} ${filteredTokens[i + 1]} ${filteredTokens[i + 2]}`;
                keywords.add(phrase3);
            }
        }
        
        // Further refine by removing duplicates and sorting
        return Array.from(keywords)
            .filter(kw => kw.split(' ').length <= 3) // Max 3 words per semantic keyword
            .sort((a, b) => b.length - a.length) // Prioritize longer phrases
            .slice(0, 20); // Limit to top 20 semantic keywords
    }


    /**
     * Validates that a keyword's language matches the post language.
     * Technical terms in English are allowed in Spanish posts if they don't contain common English stop words.
     */
    private validateKeywordLanguage(keyword: string, idioma: string, slug: string, type: string): boolean {
        const stopWordsSet = idioma === 'es' ? esExtendedStopWords : enExtendedStopWords;
        const otherStopWordsSet = idioma === 'es' ? enExtendedStopWords : esExtendedStopWords;

        const words = keyword.toLowerCase().split(/\s+/);
        
        // If the keyword contains words that are common stop words in the *other* language, it might be a mismatch.
        // We'll be more lenient for technical terms, but strict for obvious mismatches.
        const otherLangStopWordsCount = words.filter(w => otherStopWordsSet.has(w)).length;

        if (otherLangStopWordsCount > 0 && words.length > 1) { // If it's a multi-word phrase and contains other-language stop words
            const currentLangStopWordsCount = words.filter(w => stopWordsSet.has(w)).length;
            if (otherLangStopWordsCount > currentLangStopWordsCount) { // More other-language stop words than current language
                 console.warn(`⚠️  Language Mismatch in '${slug}': ${type} keyword "${keyword}" looks like it belongs to the other language but post is ${idioma}. Skipping...`);
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
            // Index both primary and semantic keywords
            const keywordsToIndex = [...post.primary_keywords, ...(post.semantic_keywords || [])];

            for (const keyword of keywordsToIndex) {
                const variations = this.generateVariations(keyword);

                // Check for keyword cannibalization (only for primary keywords, semantic can be duplicates)
                const isPrimary = post.primary_keywords.includes(keyword);

                if (isPrimary && this.keywordIndex.has(keyword) && this.keywordIndex.get(keyword)!.targetPost.slug !== post.slug) {
                    console.warn(
                        `⚠️  Keyword Cannibalization Warning: The primary keyword "${keyword}" is claimed by both '${
                            this.keywordIndex.get(keyword)!.targetPost.slug
                        }' and '${post.slug}'. The first one found will be used.`,
                    );
                    continue; // Skip re-assigning this keyword
                }

                // If a semantic keyword clashes with an already indexed primary keyword, prioritize the primary
                if (!isPrimary && this.keywordIndex.has(keyword) && this.keywordIndex.get(keyword)!.targetPost.clusterType === 'Pillar') {
                    // If an existing entry is a Pillar, keep it
                    continue;
                }

                const match: KeywordMatch = {
                    keyword,
                    variations,
                    targetPost: post,
                    priority: post.clusterType === 'Pillar' ? 2 : 1, 
                };

                // Index both the primary keyword and all its variations
                variations.forEach(v => {
                    // Only add if not already indexed or if the current one has higher priority (e.g., primary over semantic)
                    if (!this.keywordIndex.has(v) || (isPrimary && this.keywordIndex.get(v)!.targetPost.slug !== post.slug)) {
                        this.keywordIndex.set(v, match);
                    }
                });
            }
        }

        return this.keywordIndex;
    }

    /**
     * Generate semantic variations of a keyword using pluralize for better accuracy.
     * Handles plural/singular, case variations, and hyphenated forms.
     */
    private generateVariations(keyword: string): string[] {
        const variations = new Set<string>();
        const lowerKeyword = keyword.toLowerCase();

        // Original forms
        variations.add(lowerKeyword);
        variations.add(lowerKeyword.charAt(0).toUpperCase() + lowerKeyword.slice(1));
        variations.add(lowerKeyword.toUpperCase());

        // Plural/Singular forms using pluralize
        if (pluralize.isSingular(lowerKeyword)) {
            const plural = pluralize.plural(lowerKeyword);
            variations.add(plural);
            variations.add(plural.charAt(0).toUpperCase() + plural.slice(1));
        } else if (pluralize.isPlural(lowerKeyword)) {
            const singular = pluralize.singular(lowerKeyword);
            variations.add(singular);
            variations.add(singular.charAt(0).toUpperCase() + singular.slice(1));
        }

        // Handle hyphenated <-> space-separated
        if (lowerKeyword.includes('-')) {
            const spaced = lowerKeyword.replace(/-/g, ' ');
            variations.add(spaced);
            variations.add(spaced.charAt(0).toUpperCase() + spaced.slice(1));
        } else if (lowerKeyword.includes(' ')) {
            const hyphenated = lowerKeyword.replace(/\s+/g, '-');
            variations.add(hyphenated);
            variations.add(hyphenated.charAt(0).toUpperCase() + hyphenated.slice(1));
        }

        return Array.from(variations).filter(v => v.length > 0);
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

