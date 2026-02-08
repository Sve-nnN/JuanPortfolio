import * as fs from 'fs';
import matter from 'gray-matter';
import type { LinkOpportunity, LinkingResult, PostMetadata } from './types';

/**
 * Injects markdown links into post content while preserving structure.
 * 
 * This class:
 * - Parses markdown safely
 * - Inserts links at identified positions
 * - Avoids nested or duplicate links
 * - Preserves code blocks, headings, and formatting
 * - Tracks changes for reporting
 */
export class LinkInjector {
    /**
     * Apply link opportunities to posts.
     */
    applyLinks(opportunities: Map<string, LinkOpportunity[]>, dryRun: boolean): LinkingResult {
        const modifiedPosts: string[] = [];
        let linksAdded = 0;
        const allSkipped: Array<{ opportunity: LinkOpportunity; reason: string }> = [];
        const errors: Array<{ post: string; error: string }> = [];

        for (const [slug, ops] of opportunities.entries()) {
            if (ops.length === 0) continue;

            const sourcePost = ops[0].sourcePost;

            try {
                const result = this.processPost(sourcePost, ops);

                if (!dryRun && result.linksAdded > 0) {
                    // Write modified content
                    fs.writeFileSync(sourcePost.filePath, result.content, 'utf-8');
                    modifiedPosts.push(sourcePost.filePath);
                }

                linksAdded += result.linksAdded;
                allSkipped.push(...result.skipped);

            } catch (error) {
                errors.push({
                    post: sourcePost.slug,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }

        return {
            linksAdded,
            modifiedPosts,
            skipped: allSkipped,
            errors,
            contentGaps: [] // Will be populated by the main script
        };
    }

    /**
     * Process a single post and insert links.
     */
    private processPost(
        post: PostMetadata,
        opportunities: LinkOpportunity[]
    ): {
        content: string;
        linksAdded: number;
        skipped: Array<{ opportunity: LinkOpportunity; reason: string }>;
    } {
        const fileContent = fs.readFileSync(post.filePath, 'utf-8');
        const { data: frontmatter, content: body } = matter(fileContent);

        const lines = body.split('\n');
        const skipped: Array<{ opportunity: LinkOpportunity; reason: string }> = [];
        let linksAdded = 0;

        // Track which keywords have been linked and where
        const linkedKeywords = new Map<string, Set<number>>();

        // Sort opportunities by line number (descending) to avoid offset issues
        const sortedOps = [...opportunities].sort((a, b) => b.lineNumber - a.lineNumber);

        for (const opp of sortedOps) {
            const lineIndex = opp.lineNumber - 1;

            if (lineIndex < 0 || lineIndex >= lines.length) {
                skipped.push({
                    opportunity: opp,
                    reason: 'Invalid line number',
                });
                continue;
            }

            const line = lines[lineIndex];

            // Double-check exclusions (in case content changed)
            if (this.shouldSkipLine(line)) {
                skipped.push({
                    opportunity: opp,
                    reason: 'Line matches exclusion pattern',
                });
                continue;
            }

            // Check if already linked at this position
            const keywordLower = opp.keyword.toLowerCase();
            const linkedLines = linkedKeywords.get(keywordLower) || new Set();
            if (linkedLines.has(lineIndex)) {
                skipped.push({
                    opportunity: opp,
                    reason: 'Keyword already linked on this line',
                });
                continue;
            }

            // Attempt to insert link
            const modifiedLine = this.insertLink(line, opp);

            if (modifiedLine === line) {
                skipped.push({
                    opportunity: opp,
                    reason: 'Could not safely insert link',
                });
                continue;
            }

            // Update the line
            lines[lineIndex] = modifiedLine;
            linksAdded++;

            // Track this link
            linkedLines.add(lineIndex);
            linkedKeywords.set(keywordLower, linkedLines);
        }

        // Reconstruct content
        const modifiedBody = lines.join('\n');
        const modifiedContent = matter.stringify(modifiedBody, frontmatter);

        return {
            content: modifiedContent,
            linksAdded,
            skipped,
        };
    }

    /**
     * Insert a link into a line of text.
     */
    private insertLink(line: string, opportunity: LinkOpportunity): string {
        const { keyword, targetPost } = opportunity;

        // Create markdown link
        const link = `[${keyword}](${targetPost.url})`;

        // Find the keyword in the line (preserve case)
        const regex = new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, 'i');
        const match = regex.exec(line);

        if (!match) {
            return line; // Keyword not found (shouldn't happen, but safety check)
        }

        const matchIndex = match.index;

        // Verify not inside excluded context
        if (this.isInsideExcludedContext(line, matchIndex, keyword.length)) {
            return line; // Can't safely insert
        }

        // Replace the first occurrence
        const before = line.substring(0, matchIndex);
        const after = line.substring(matchIndex + keyword.length);

        return before + link + after;
    }

    /**
     * Check if line should be skipped for linking.
     */
    private shouldSkipLine(line: string): boolean {
        // Skip headings
        if (/^#{1,6}\s/.test(line)) return true;

        // Skip code blocks
        if (/^```|^~~~/.test(line)) return true;

        // Skip frontmatter
        if (/^---$/.test(line)) return true;

        return false;
    }

    /**
     * Check if position is inside excluded context (copied from ContentScanner for safety).
     */
    private isInsideExcludedContext(line: string, matchIndex: number, matchLength: number): boolean {
        const beforeMatch = line.substring(0, matchIndex);
        const afterMatch = line.substring(matchIndex + matchLength);

        // Check if inside inline code
        const backticks = (beforeMatch.match(/`/g) || []).length;
        if (backticks % 2 !== 0) return true;

        // Check if inside existing link text
        if (/\[[^\]]*$/.test(beforeMatch) && /^[^\]]*\]/.test(afterMatch)) {
            return true;
        }

        // Check if inside existing link URL
        if (/\([^\)]*$/.test(beforeMatch) && /^[^\)]*\)/.test(afterMatch)) {
            return true;
        }

        // Check if already surrounded by link markers
        if (beforeMatch.endsWith('[') && afterMatch.startsWith('](')) {
            return true;
        }

        return false;
    }

    /**
     * Escape regex special characters.
     */
    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
