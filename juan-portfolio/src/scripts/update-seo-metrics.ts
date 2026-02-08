import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { getPayload } from 'payload';
import config from '../payload.config';
import { DataForSeoAdapter } from './seo/adapters/DataForSeoAdapter';
import { GoogleAdsAdapter } from './seo/adapters/GoogleAdsAdapter';
import { SerpApiAdapter } from './seo/adapters/SerpApiAdapter';
import { SeoAdapter } from './seo/types';
import { SeoService } from './seo/SeoService';

// --- Configuration ---
const KEYWORDS_FILE_PATH = path.join(process.cwd(), 'content', 'keywords.md');

// --- Interfaces ---

/**
 * Data structure for a keyword entry in keywords.md
 */
interface KeywordData {
    keyword: string;
    targetUrl: string;
    volume: number;
    difficulty: number;
    intent: string;
    status: string;
    lastUpdated: string;
    source: string;
    // Enhanced SERP features
    relatedSearches: string[];
    paaCount: number;
    topDomain: string;
    hasAiOverview: boolean;
    serpFeatures: string[];
}

// --- Helper Functions ---

/**
 * Factory to choose the best available adapter.
 */
function getSeoAdapter(preferredSource?: string): SeoAdapter {
    // Priority 0: CLI Argument / Parameters
    if (preferredSource) {
        console.log(`Preferred source requested: ${preferredSource}`);
        switch (preferredSource.toLowerCase()) {
            case 'google-ads':
                if (process.env.GOOGLE_ADS_DEVELOPER_TOKEN && process.env.GOOGLE_ADS_CLIENT_ID) return new GoogleAdsAdapter();
                console.warn('Google Ads credentials missing. Falling back to auto-detection.');
                break;
            case 'serpapi':
                if (process.env.SERPAPI_API_KEY) return new SerpApiAdapter();
                console.warn('SerpApi credentials missing. Falling back to auto-detection.');
                break;
            case 'dataforseo':
                if (process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD) return new DataForSeoAdapter();
                console.warn('DataForSEO credentials missing. Falling back to auto-detection.');
                break;
            case 'mock':
                return createMockAdapter();
            default:
                console.warn(`Unknown source "${preferredSource}". Falling back to auto-detection.`);
        }
    }

    // Priority 1: Google Ads
    if (process.env.GOOGLE_ADS_DEVELOPER_TOKEN && process.env.GOOGLE_ADS_CLIENT_ID) {
        console.log('Using Google Ads Adapter');
        return new GoogleAdsAdapter();
    }

    // Priority 2: SerpApi (New)
    if (process.env.SERPAPI_API_KEY) {
        console.log('Using SerpApi Adapter');
        return new SerpApiAdapter();
    }

    // Priority 3: DataForSEO
    if (process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD) {
        console.log('Using DataForSEO Adapter');
        return new DataForSeoAdapter();
    }

    // Priority 4: Mock Adapter
    console.log('Using Mock Adapter (No API credentials found)');
    return {
        providerName: 'Mock',
        async fetchMetrics(keyword: string) {
            await new Promise(resolve => setTimeout(resolve, 50));
            const volume = (keyword.length * 100) % 5000 + 50;
            const difficulty = (keyword.length * 7) % 100;
            return { volume, difficulty };
        }
    };
}

function createMockAdapter(): SeoAdapter {
    return {
        providerName: 'Mock',
        async fetchMetrics(keyword: string) {
            await new Promise(resolve => setTimeout(resolve, 50));
            const volume = (keyword.length * 100) % 5000 + 50;
            const difficulty = (keyword.length * 7) % 100;
            return { volume, difficulty };
        }
    };
}

/**
 * Parses the Markdown table line to extract keyword data.
 */
function parseLine(line: string): KeywordData | null {
    // Split by pipe and trim white space. 
    // Do NOT filter out empty strings blindly, as empty columns are valid.
    // Standard markdown table lines start with | and end with |.
    // So split will result in empty first and last elements.
    const parts = line.split('|').map(p => p.trim());

    // Remove the first empty element (before the first |)
    if (parts.length > 0 && parts[0] === '') parts.shift();
    // Remove the last empty element (after the last |)
    if (parts.length > 0 && parts[parts.length - 1] === '') parts.pop();

    if (parts.length < 7) return null;

    // Parse SERP features (new columns 8-12)
    const parseArray = (str: string): string[] => {
        if (!str || str === '') return [];
        return str.split(';').map(s => s.trim()).filter(s => s);
    };

    return {
        keyword: parts[0],
        targetUrl: parts[1],
        volume: parseInt(parts[2]) || 0,
        difficulty: parseInt(parts[3]) || 0,
        intent: parts[4],
        status: parts[5],
        lastUpdated: parts[6] || '',
        source: parts[7] || '',
        relatedSearches: parseArray(parts[8] || ''),
        paaCount: parseInt(parts[9]) || 0,
        topDomain: parts[10] || '',
        hasAiOverview: parts[11] === 'Yes',
        serpFeatures: parseArray(parts[12] || '')
    };
}

/**
 * Formats a KeywordData object back into a Markdown table line.
 */
function formatLine(data: KeywordData): string {
    const formatArray = (arr: string[]): string => arr.join('; ');
    const formatBoolean = (val: boolean): string => val ? 'Yes' : 'No';

    return `| ${data.keyword} | ${data.targetUrl} | ${data.volume} | ${data.difficulty} | ${data.intent} | ${data.status} | ${data.lastUpdated} | ${data.source} | ${formatArray(data.relatedSearches)} | ${data.paaCount} | ${data.topDomain} | ${formatBoolean(data.hasAiOverview)} | ${formatArray(data.serpFeatures)} |`;
}

// --- Main Execution ---

async function updateKeywords() {
    // Initialize Payload
    const payload = await getPayload({ config });

    if (!fs.existsSync(KEYWORDS_FILE_PATH)) {
        console.error(`Error: File not found at ${KEYWORDS_FILE_PATH}`);
        process.exit(1);
    }

    const args = process.argv.slice(2);
    const sourceArg = args.find(arg => arg.startsWith('--source='));
    const options = {
        source: sourceArg ? sourceArg.split('=')[1] : undefined
    };

    // Get Adapter
    const adapter = getSeoAdapter(options.source);
    console.log(`Using SEO Adapter: ${adapter.providerName}`);

    const service = new SeoService(adapter, payload);

    const fileContent = fs.readFileSync(KEYWORDS_FILE_PATH, 'utf-8');
    const lines = fileContent.split('\n');
    const updatedLines: string[] = [];
    const today = new Date().toISOString().split('T')[0];

    let headerProcessed = false;
    let separatorProcessed = false;

    for (const line of lines) {
        // Keep header and separator lines as is
        if (!headerProcessed) {
            if (line.includes('| Keyword') && line.trim().startsWith('|')) {
                // Replace with complete header including new SERP features
                updatedLines.push('| Keyword | Target URL | Volume | Difficulty | Intent | Status | Last Updated | Source | Related Searches | PAA Count | Top Domain | Has AI Overview | SERP Features |');
                headerProcessed = true;
                continue;
            }
        }
        if (headerProcessed && !separatorProcessed) {
            if (line.includes('---')) {
                // Separator for 13 columns
                updatedLines.push('| :-------------------------------- | :-------------------------------------------- | :----- | :--------- | :----- | :----- | :----------- | :----- | :--------------- | :-------- | :--------- | :-------------- | :------------ |');
                separatorProcessed = true;
                continue;
            }
        }

        // Process data lines
        if (headerProcessed && separatorProcessed && line.trim().startsWith('|')) {
            const data = parseLine(line);

            if (!data) {
                // console.log(`[DEBUG] Failed to parse: ${line.substring(0, 30)}...`);
            }

            if (data) {
                // Smart Caching: Skip if updated today
                if (data.lastUpdated === today) {
                    updatedLines.push(formatLine(data));
                    continue;
                }

                console.log(`Processing: "${data.keyword}"`);
                try {
                    const metrics = await adapter.fetchMetrics(data.keyword);

                    if (metrics) {
                        data.volume = metrics.volume;
                        data.difficulty = metrics.difficulty;
                        data.lastUpdated = today;
                        data.source = adapter.providerName;
                        // Populate new SERP features
                        data.relatedSearches = metrics.relatedSearches || [];
                        data.paaCount = metrics.paaCount || 0;
                        data.topDomain = metrics.topDomain || '';
                        data.hasAiOverview = metrics.hasAiOverview || false;
                        data.serpFeatures = metrics.serpFeatures || [];
                        console.log(`Updated: ${data.keyword} (Vol: ${data.volume}, PAA: ${data.paaCount})`);
                    } else {
                        console.warn(`Skipping update for "${data.keyword}" (No data returned)`);
                    }
                    updatedLines.push(formatLine(data));
                } catch (error) {
                    console.error(`Failed to update ${data.keyword}:`, error);
                    updatedLines.push(line); // Keep original if update fails
                }
            } else {
                updatedLines.push(line); // Keep malformed/empty lines
            }
        } else {
            updatedLines.push(line); // Comments, empty lines, etc.
        }
    }

    fs.writeFileSync(KEYWORDS_FILE_PATH, updatedLines.join('\n'));
    console.log(`\nSuccess! Updated keywords file at ${KEYWORDS_FILE_PATH}`);
}

updateKeywords().then(() => {
    console.log('Script completed.');
    process.exit(0);
}).catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
});
