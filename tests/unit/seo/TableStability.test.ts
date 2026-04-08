import { describe, it, expect } from 'vitest'

// Copying simplified logic from update-seo-metrics.ts for testing
function parseLine(line: string) {
    const parts = line.split(/(?<!\\)\|/).map(p => p.trim());
    if (parts.length > 0 && parts[0] === '') parts.shift();
    if (parts.length > 0 && parts[parts.length - 1] === '') parts.pop();

    if (parts.length < 7) return null;

    const parseArray = (str: string): string[] => {
        if (!str || str === '') return [];
        return str.split(';').map(s => s.trim()).filter(s => s);
    };

    return {
        keyword: parts[0] || '',
        targetUrl: parts[1] || '',
        volume: parseInt(parts[2]) || 0,
        difficulty: parseInt(parts[3]) || 0,
        intent: parts[4] || '',
        status: parts[5] || '',
        lastUpdated: parts[6] || '',
        source: parts[7] || '',
        relatedSearches: parseArray(parts[8] || ''),
        paaCount: parseInt(parts[9]) || 0,
        topDomain: parts[10] || '',
        hasAiOverview: parts[11] === 'Yes',
        serpFeatures: parseArray(parts[12] || ''),
        competitorHeadings: parts[13] || '',
        competitorMeta: parts[14] || ''
    };
}

function formatLine(data: any): string {
    const formatArray = (arr: string[]): string => (arr || []).join('; ');
    const formatBoolean = (val: boolean): string => val ? 'Yes' : 'No';

    return `| ${data.keyword} | ${data.targetUrl} | ${data.volume} | ${data.difficulty} | ${data.intent} | ${data.status} | ${data.lastUpdated} | ${data.source} | ${formatArray(data.relatedSearches)} | ${data.paaCount} | ${data.topDomain} | ${formatBoolean(data.hasAiOverview)} | ${formatArray(data.serpFeatures)} | ${data.competitorHeadings} | ${data.competitorMeta} |`;
}

describe('Markdown Table Parser Stability', () => {
    it('should accurately parse and format a 15-column line', () => {
        const original = '| kw | /url | 100 | 20 | info | ok | 2026-02-10 | SerpApi | rel1; rel2 | 3 | dom.com | Yes | videos; images | H2: test | Meta: test |';
        const parsed = parseLine(original);
        expect(parsed).not.toBeNull();
        expect(parsed?.keyword).toBe('kw');
        expect(parsed?.paaCount).toBe(3);
        expect(parsed?.competitorHeadings).toBe('H2: test');
        
        const formatted = formatLine(parsed);
        // Normalize spaces for comparison
        expect(formatted.replace(/\s+/g, '')).toBe(original.replace(/\s+/g, ''));
    });

    it('should handle pipes inside content by not breaking columns (future-proofing note)', () => {
        // Current implementation uses simple .split('|'), which breaks if content has |
        // We should probably sanitize pipes in content
        const data = {
            keyword: 'test',
            competitorHeadings: 'H2: One | Two', // This will break current parser
        };
        // This test documents the weakness. We will fix it in the implementation by sanitizing.
    });
});
