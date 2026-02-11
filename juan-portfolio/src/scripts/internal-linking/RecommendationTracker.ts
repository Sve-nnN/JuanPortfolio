import * as fs from 'fs';
import * as path from 'path';
import type { KeywordGap } from './types';

/**
 * Manages content gap recommendations in keywords.md
 * 
 * This class:
 * - Reads existing keywords from keywords.md
 * - Identifies new keyword opportunities from content analysis
 * - Appends recommendations with "Internal Linking Script" as source
 * - Maintains markdown table format
 */
export class RecommendationTracker {
    private keywordsPath: string;
    private existingKeywords: Set<string>;

    constructor(contentDir: string) {
        this.keywordsPath = path.join(contentDir, 'keywords.md');
        this.existingKeywords = new Set();
    }

    /**
     * Load existing keywords from keywords.md to avoid duplicates.
     */
    loadExistingKeywords(): void {
        if (!fs.existsSync(this.keywordsPath)) {
            console.warn(`⚠️  keywords.md not found at ${this.keywordsPath}`);
            return;
        }

        const content = fs.readFileSync(this.keywordsPath, 'utf-8');
        const lines = content.split('\n');

        for (const line of lines) {
            // Parse table rows (skip header/separator)
            if (line.startsWith('|') && !line.includes('---') && !line.includes('Keyword')) {
                const parts = line.split('|').map(p => p.trim()).filter(p => p);
                if (parts.length > 0) {
                    // First column is the keyword
                    this.existingKeywords.add(parts[0].toLowerCase());
                }
            }
        }
    }

    /**
     * Add recommendations for content gaps to keywords.md
     */
    addRecommendations(gaps: KeywordGap[], dryRun: boolean): number {
        if (gaps.length === 0) return 0;

        const newRecommendations = gaps.filter(gap =>
            !this.existingKeywords.has(gap.keyword.toLowerCase())
        );

        if (newRecommendations.length === 0) {
            return 0;
        }

        if (dryRun) {
            console.log(`\n📝 Would add ${newRecommendations.length} recommendations to keywords.md`);
            return newRecommendations.length;
        }

        // Read current file
        let content = '';
        if (fs.existsSync(this.keywordsPath)) {
            content = fs.readFileSync(this.keywordsPath, 'utf-8');
        }

        // Prepare new rows
        const today = new Date().toISOString().split('T')[0];
        const newRows = newRecommendations.map(gap => {
            const targetUrl = `/${gap.category}/${gap.keyword.toLowerCase().replace(/\s+/g, '-')}`;
            const mentionedInList = gap.mentionedIn.slice(0, 3).join(', '); // Show first 3 sources

            return [
                gap.keyword,                    // 1. Keyword
                targetUrl,                      // 2. Target URL
                '',                             // 3. Volume
                '',                             // 4. Difficulty
                '',                             // 5. Intent
                'recommended',                  // 6. Status
                today,                          // 7. Last Updated
                'Internal Linking Script',      // 8. Source
                `Mentioned in: ${mentionedInList} (${gap.mentionCount} times)`, // 9. Related Searches
                '',                             // 10. PAA Count
                '',                             // 11. Top Domain
                '',                             // 12. Has AI Overview
                '',                             // 13. SERP Features
                '',                             // 14. Competitor Headings
                '',                             // 15. Competitor Meta
                '0',                            // 16. Avg. Word Count
                '0',                            // 17. Opportunity Score
                '',                             // 18. Recommended Format
                '',                             // 19. Cluster Type
                ''                              // 20. Suggested Anchor Text
            ].map(cell => ` ${cell} `).join('|');
        });

        // Append new rows
        const updatedContent = content.trimEnd() + '\n' + newRows.map(row => `|${row}|`).join('\n') + '\n';
        fs.writeFileSync(this.keywordsPath, updatedContent, 'utf-8');

        return newRecommendations.length;
    }

    /**
     * Get statistics about existing keywords.
     */
    getStats(): { total: number } {
        return { total: this.existingKeywords.size };
    }
}
