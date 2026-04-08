import * as fs from 'fs';
import matter from 'gray-matter';
import natural from 'natural';
import type { PostMetadata, KeywordMatch, LinkOpportunity, LinkingConfig } from './types';
import { createEmbeddingProvider } from './semantic/embedding-provider';
import { scoreOpportunities } from './semantic/scorer';
import type { EmbeddingProvider } from './semantic/types';

/**
 * Scans post content for keyword matches and identifies linking opportunities.
 * 
 * This class:
 * - Reads markdown files and parses content
 * - Identifies keyword mentions in body text
 * - Excludes code blocks, headings, and existing links
 * - Scores relevance based on context
 * - Respects linking limits and exclusion rules
 */
export class ContentScanner {
    private groupedKeywords: Map<string, { match: KeywordMatch, variations: string[] }> = new Map();
    private blacklist = new Set([
        'version coming', 'coming soon', 'read more', 'click here', 
        'este post', 'guía completa', 'manual', 'tutorial', 
        'proximamente', 'ver más', 'leer más', 'aquí', 'enlace',
        'link', 'post', 'articulo', 'artículo'
    ]);

    constructor(
        private keywordIndex: Map<string, KeywordMatch>,
        private config: LinkingConfig,
        private embeddingProvider?: EmbeddingProvider,
    ) {
        this.groupKeywords();
    }

    /**
     * Groups variations by their primary keyword to avoid duplicate matching for the same target.
     */
    private groupKeywords() {
        for (const [variation, match] of this.keywordIndex.entries()) {
            // Skip blacklisted phrases
            if (this.blacklist.has(variation.toLowerCase())) continue;

            const primary = match.keyword;
            if (!this.groupedKeywords.has(primary)) {
                this.groupedKeywords.set(primary, {
                    match,
                    variations: []
                });
            }
            this.groupedKeywords.get(primary)!.variations.push(variation);
        }

        // Sort variations by length descending to match longest phrases first
        for (const group of this.groupedKeywords.values()) {
            group.variations.sort((a, b) => b.length - a.length);
        }
    }

    /**
     * Scan a post for linking opportunities.
     */
    scanPost(post: PostMetadata, _allPosts: PostMetadata[]): LinkOpportunity[] {
        const fileContent = fs.readFileSync(post.filePath, 'utf-8');
        const { content: body } = matter(fileContent);

        // Find existing links to avoid duplicates
        const existingLinks = this.findExistingLinks(body);

        // Find where the body starts in the original file to get correct line numbers
        const fileLines = fileContent.split('\n');
        let bodyStartIndex = 0;
        
        if (fileContent.startsWith('---')) {
            for (let i = 1; i < fileLines.length; i++) {
                if (fileLines[i].trim() === '---') {
                    bodyStartIndex = i + 1;
                    break;
                }
            }
        }

        const opportunities: LinkOpportunity[] = [];
        const lines = body.split('\n');

        // Track links already used for each keyword across the whole post
        const keywordLinkCount = new Map<string, number>();
        // Track target posts already linked across the WHOLE post
        const linkedTargetSlugsInPost = new Set<string>();
        let isInsideCodeBlock = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = bodyStartIndex + i + 1;

            // Toggle code block state
            if (/^```|^~~~/.test(line)) {
                isInsideCodeBlock = !isInsideCodeBlock;
                continue;
            }

            // Skip if inside code block or excluded pattern
            if (isInsideCodeBlock || this.shouldExcludeLine(line)) {
                continue;
            }

            // Killer Feature: Context Quality Check
            // Don't link in very short sentences or sentences that look like placeholders
            const sentenceLength = line.split(' ').length;
            if (sentenceLength < 6 && (line.toLowerCase().includes('coming') || line.toLowerCase().includes('proximamente'))) {
                continue;
            }

            // Iterate through target posts (grouped by primary keyword)
            for (const group of this.groupedKeywords.values()) {
                const { match, variations } = group;

                // 1. Don't link to self
                if (match.targetPost.slug === post.slug) {
                    continue;
                }

                // 1b. Locale isolation: only link posts in the same language
                if (this.isDifferentLocale(match.targetPost, post)) {
                    continue;
                }

                // 1c. Cluster Match: Only link to posts within the same category (cluster)
                if (match.targetPost.category !== post.category) {
                    if (this.config.verbose) {
                        console.log(`Skipping link from ${post.slug} to ${match.targetPost.slug}: different categories (${post.category} != ${match.targetPost.category})`);
                    }
                    continue;
                }

                // 2. Don't link if already linked to this target in THIS post
                if (linkedTargetSlugsInPost.has(match.targetPost.slug)) {
                    continue;
                }

                // 3. Don't link if an existing link to this target post already exists in the body
                const relativeUrl = match.targetPost.url.replace('https://juan-tech.com', '');
                if (existingLinks.has(match.targetPost.url) || existingLinks.has(relativeUrl)) {
                    continue;
                }

                // 4. Check if we've hit the limit for this keyword across the whole post
                const currentCount = keywordLinkCount.get(match.keyword) || 0;
                if (currentCount >= this.config.maxLinksPerKeyword) {
                    continue;
                }

                // 5. Try to match any variation of this keyword
                for (const variation of variations) {
                    const regex = new RegExp(`\\b${this.escapeRegex(variation)}\\b`, 'i');
                    const regexMatch = regex.exec(line);

                    if (regexMatch) {
                        const matchIndex = regexMatch.index!;
                        
                        // Verify this match isn't inside an existing link or other excluded context
                        if (this.isInsideExcludedContext(line, matchIndex, variation.length)) {
                            continue;
                        }

                        // Valid opportunity found!
                        const contextStart = Math.max(0, i - 1);
                        const contextEnd = Math.min(lines.length - 1, i + 1);
                        const context = lines.slice(contextStart, contextEnd + 1).join('\n');
                        const relevance = this.calculateRelevance(variation, match, context, post);

                        opportunities.push({
                            sourcePost: post,
                            targetPost: match.targetPost,
                            keyword: regexMatch[0], // Preserve original case
                            context,
                            lineNumber,
                            relevance,
                        });

                        // Update tracking
                        keywordLinkCount.set(match.keyword, currentCount + 1);
                        linkedTargetSlugsInPost.add(match.targetPost.slug);
                        
                        break; // Stop checking variations for THIS target post
                    }
                }
            }
        }

        // Sort by relevance (highest first)
        return opportunities.sort((a, b) => b.relevance - a.relevance);
    }

    /**
     * Returns true when two posts belong to different locales and should not cross-link.
     * Exposed as a protected method so it can be unit-tested via `(scanner as any)`.
     */
    protected isDifferentLocale(a: PostMetadata, b: PostMetadata): boolean {
        const localeA = a.idioma ?? 'es'
        const localeB = b.idioma ?? 'es'
        return localeA !== localeB
    }

    /**
     * Check if a line should be excluded from linking.
     */
    private shouldExcludeLine(line: string): boolean {
        // Skip empty lines
        if (!line.trim()) return true;

        // Skip headings
        if (/^#{1,6}\s/.test(line)) return true;

        // Skip code blocks (``` or ~~~)
        if (/^```|^~~~/.test(line)) return true;

        // Skip YAML frontmatter
        if (/^---$/.test(line)) return true;

        // Skip HTML comments
        if (/^<!--/.test(line)) return true;

        // Skip lines that are purely lists or bullets without content
        if (/^[-*+]\s*$/.test(line)) return true;

        // Apply custom exclude patterns
        for (const pattern of this.config.excludePatterns) {
            if (pattern.test(line)) return true;
        }

        return false;
    }

    /**
     * Check if a match position is inside an excluded context (link, code, etc).
     */
    private isInsideExcludedContext(line: string, matchIndex: number, matchLength: number): boolean {
        const beforeMatch = line.substring(0, matchIndex);
        const afterMatch = line.substring(matchIndex + matchLength);

        // Check if inside inline code (`)
        const backticks = (beforeMatch.match(/`/g) || []).length;
        if (backticks % 2 !== 0) return true; // Odd number = inside code

        // Check if inside an existing markdown link
        // Pattern: [text](url) - match is inside [...]
        const linkTextMatch = beforeMatch.match(/\[[^\]]*$/);
        if (linkTextMatch && afterMatch.match(/^[^\]]*\]/)) return true;

        // Pattern: match is inside (url)
        const linkUrlMatch = beforeMatch.match(/\([^\)]*$/);
        if (linkUrlMatch && afterMatch.match(/^[^\)]*\)/)) return true;

        // Check if already marked as a link target
        if (beforeMatch.endsWith('[') && afterMatch.startsWith('](')) return true;

        return false;
    }

    /**
     * Calculate relevance score for a linking opportunity.
     */
    private calculateRelevance(
        keyword: string,
        match: KeywordMatch,
        context: string,
        sourcePost: PostMetadata
    ): number {
        let score = 0.3; // Base score

        // 1. Authority Weighting (Cluster Logic)
        // Linking to a Pillar post is generally higher value
        if (match.targetPost.clusterType === 'Pillar') {
            score += 0.2;
        }

        // 2. Exact Keyword Match Bonus
        if (keyword.toLowerCase() === match.keyword.toLowerCase()) {
            score += 0.2;
        }

        // 3. Jaccard Similarity (NLP)
        // Compare context tokens with target post keywords
        const tokenizer = new natural.WordTokenizer();
        const _contextTokens = tokenizer.tokenize(context.toLowerCase()) || [];
        const targetKeywordsStr = [...match.targetPost.primary_keywords, ...(match.targetPost.semantic_keywords || [])].join(' ');

        const similarity = natural.DiceCoefficient(context.toLowerCase(), targetKeywordsStr.toLowerCase());
        score += similarity * 0.5; // Up to 0.5 bonus for high semantic match

        // 4. Silo Bonus
        // Posts in the same category have higher structural relevance
        if (sourcePost.category === match.targetPost.category) {
            score += 0.1;
        }

        // Normalize to 0-1 range
        return Math.max(0, Math.min(1, score));
    }

    /**
     * Escape special regex characters in keyword.
     */
    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Scan all posts and return opportunities.
     */
    async scanAllPosts(posts: PostMetadata[]): Promise<Map<string, LinkOpportunity[]>> {
        const allOpportunities = new Map<string, LinkOpportunity[]>();
        const semanticConfig = this.config.semantic;
        const semanticEnabled = semanticConfig?.enabled !== false;
        const provider = semanticEnabled
            ? (this.embeddingProvider ?? await createEmbeddingProvider(semanticConfig))
            : undefined;

        for (const post of posts) {
            let opportunities = this.scanPost(post, posts);
            if (opportunities.length > 0 && provider) {
                opportunities = await scoreOpportunities(opportunities, provider, semanticConfig?.weights);
            }
            if (opportunities.length > 0) {
                allOpportunities.set(post.slug, opportunities);
            }
        }

        return allOpportunities;
    }

    /**
     * Identify content gaps: keywords mentioned but without dedicated posts.
     */
    findContentGaps(posts: PostMetadata[]): Map<string, { count: number; sources: Set<string>; category: string }> {
        const keywordMentions = new Map<string, { count: number; sources: Set<string>; category: string }>();

        // Track all keywords with dedicated posts
        const coveredKeywords = new Set<string>();
        for (const post of posts) {
            for (const keyword of post.primary_keywords) {
                coveredKeywords.add(keyword.toLowerCase());
            }
        }

        // Scan content for mentions of uncovered keywords
        for (const post of posts) {
            const fileContent = fs.readFileSync(post.filePath, 'utf-8');
            const { content: body } = matter(fileContent);
            const lines = body.split('\n');
            let isInsideCodeBlock = false;
            
            // To track if a keyword has been mentioned at least once in this post (for sources)
            const keywordsMentionedInThisPost = new Set<string>();

            for (const line of lines) {
                // Toggle code block state
                if (/^```|^~~~/.test(line)) {
                    isInsideCodeBlock = !isInsideCodeBlock;
                    continue;
                }

                if (isInsideCodeBlock || this.shouldExcludeLine(line)) continue;

                for (const group of this.groupedKeywords.values()) {
                    const { match, variations } = group;
                    const normalizedKeyword = match.keyword.toLowerCase();

                    // 1. Language Match: Only consider keywords intended for the same language
                    if (match.targetPost.idioma !== post.idioma) {
                        continue;
                    }

                    // 2. Skip if keyword has dedicated post (is a primary keyword for ANY post)
                    if (coveredKeywords.has(normalizedKeyword)) {
                        continue;
                    }
                    
                    // Combine all variations into a single regex for this keyword group
                    // Sort variations by length descending to match longer phrases first
                    const sortedVariations = [...variations].sort((a, b) => b.length - a.length);
                    const combinedVariationsPattern = sortedVariations.map(v => this.escapeRegex(v)).join('|');
                    const combinedVariationsRegex = new RegExp(`\\b(${combinedVariationsPattern})\\b`, 'ig');
                    combinedVariationsRegex.lastIndex = 0; // Reset for each line

                    let regexMatch;
                    while ((regexMatch = combinedVariationsRegex.exec(line)) !== null) {
                        if (this.isInsideExcludedContext(line, regexMatch.index!, regexMatch[0].length)) {
                            continue;
                        }

                        // Valid mention found - increment count for this normalizedKeyword
                        if (!keywordMentions.has(normalizedKeyword)) {
                            keywordMentions.set(normalizedKeyword, {
                                count: 0,
                                sources: new Set(),
                                category: post.category
                            });
                        }
                        const data = keywordMentions.get(normalizedKeyword)!;
                        data.count++;
                        keywordsMentionedInThisPost.add(normalizedKeyword); // Mark as mentioned in this post
                    }
                }
            }
            // After scanning the entire post, add the post slug to sources for all keywords mentioned in it
            keywordsMentionedInThisPost.forEach(kw => {
                keywordMentions.get(kw)?.sources.add(post.slug);
            });
        }
        return keywordMentions;
    }

    /**
     * Finds all existing markdown links in the content and returns their URLs.
     */
    private findExistingLinks(content: string): Set<string> {
        const urls = new Set<string>();
        const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let match;

        while ((match = regex.exec(content)) !== null) {
            urls.add(match[2]);
        }

        return urls;
    }
}
