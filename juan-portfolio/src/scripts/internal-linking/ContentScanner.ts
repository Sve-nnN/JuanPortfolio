import * as fs from 'fs';
import matter from 'gray-matter';
import type { PostMetadata, KeywordMatch, LinkOpportunity, LinkingConfig } from './types';

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
    constructor(
        private keywordIndex: Map<string, KeywordMatch>,
        private config: LinkingConfig
    ) { }

    /**
     * Scan a post for linking opportunities.
     */
    scanPost(post: PostMetadata, allPosts: PostMetadata[]): LinkOpportunity[] {
        const content = fs.readFileSync(post.filePath, 'utf-8');
        const { content: body } = matter(content);

        const opportunities: LinkOpportunity[] = [];
        const lines = body.split('\n');

        // Track links already used for each keyword
        const keywordLinkCount = new Map<string, number>();

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            // Skip excluded patterns
            if (this.shouldExcludeLine(line)) {
                continue;
            }

            // Find keyword matches in this line
            for (const [keyword, match] of this.keywordIndex.entries()) {
                // Don't link to self
                if (match.targetPost.slug === post.slug) {
                    continue;
                }

                // Check if we've hit the limit for this keyword
                const currentCount = keywordLinkCount.get(match.keyword) || 0;
                if (currentCount >= this.config.maxLinksPerKeyword) {
                    continue;
                }

                // Check if keyword appears in line (case-insensitive, word boundary)
                const regex = new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, 'gi');
                const matches = line.matchAll(regex);

                for (const regexMatch of matches) {
                    // Verify this match isn't inside an existing link or other excluded context
                    const matchIndex = regexMatch.index!;
                    if (this.isInsideExcludedContext(line, matchIndex, keyword.length)) {
                        continue;
                    }

                    // Extract context around the match
                    const contextStart = Math.max(0, i - 1);
                    const contextEnd = Math.min(lines.length - 1, i + 1);
                    const context = lines.slice(contextStart, contextEnd + 1).join('\n');

                    // Calculate relevance score
                    const relevance = this.calculateRelevance(keyword, match, context, post);

                    opportunities.push({
                        sourcePost: post,
                        targetPost: match.targetPost,
                        keyword: regexMatch[0], // Preserve original case
                        context,
                        lineNumber,
                        relevance,
                    });

                    // Update count
                    keywordLinkCount.set(match.keyword, currentCount + 1);
                    break; // Only one link per keyword per line
                }
            }
        }

        // Sort by relevance (highest first)
        return opportunities.sort((a, b) => b.relevance - a.relevance);
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
        let score = 0.5; // Base score

        // Exact keyword match (not variation) = higher score
        if (keyword.toLowerCase() === match.keyword.toLowerCase()) {
            score += 0.2;
        }

        // Same category = lower priority (prefer cross-category links for better site structure)
        if (sourcePost.category === match.targetPost.category) {
            score -= 0.1;
        }

        // Earlier in content = higher priority
        const contextPosition = context.toLowerCase().indexOf(keyword.toLowerCase());
        if (contextPosition !== -1 && contextPosition < 100) {
            score += 0.1;
        }

        // Keyword appears in a sentence with related terms
        const relatedTerms = match.targetPost.keywords;
        const contextLower = context.toLowerCase();
        const relatedCount = relatedTerms.filter(term =>
            term !== keyword && contextLower.includes(term.toLowerCase())
        ).length;
        score += Math.min(relatedCount * 0.05, 0.2);

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
    scanAllPosts(posts: PostMetadata[]): Map<string, LinkOpportunity[]> {
        const allOpportunities = new Map<string, LinkOpportunity[]>();

        for (const post of posts) {
            const opportunities = this.scanPost(post, posts);
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
            for (const keyword of post.keywords) {
                coveredKeywords.add(keyword.toLowerCase());
            }
        }

        // Scan content for mentions of uncovered keywords
        for (const post of posts) {
            const content = fs.readFileSync(post.filePath, 'utf-8');
            const { content: body } = matter(content);
            const lines = body.split('\n');

            for (const [keyword, match] of this.keywordIndex.entries()) {
                const normalizedKeyword = match.keyword.toLowerCase();

                // Skip if keyword has dedicated post
                if (coveredKeywords.has(normalizedKeyword)) {
                    continue;
                }

                // Count valid mentions
                for (const line of lines) {
                    if (this.shouldExcludeLine(line)) continue;

                    const regex = new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, 'gi');
                    const matches = line.matchAll(regex);

                    for (const regexMatch of matches) {
                        const matchIndex = regexMatch.index!;
                        if (this.isInsideExcludedContext(line, matchIndex, keyword.length)) {
                            continue;
                        }

                        // Valid mention found
                        if (!keywordMentions.has(match.keyword)) {
                            keywordMentions.set(match.keyword, {
                                count: 0,
                                sources: new Set(),
                                category: post.category
                            });
                        }

                        const data = keywordMentions.get(match.keyword)!;
                        data.count++;
                        data.sources.add(post.slug);
                    }
                }
            }
        }

        return keywordMentions;
    }
}
