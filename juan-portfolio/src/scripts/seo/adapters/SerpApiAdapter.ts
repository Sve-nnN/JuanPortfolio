import { SeoAdapter, SeoMetrics } from '../types';

interface RelatedQuestion {
    question?: string
    snippet?: string
    list?: string[]
    title?: string
    link?: string
}

interface OrganicResult {
    link?: string
    title?: string
    snippet?: string
    date?: string
}

interface AiOverviewTextBlock {
    type: string
    snippet: string
}

interface AiOverview {
    text_blocks?: AiOverviewTextBlock[]
}

interface SerpApiResponse {
    search_information?: {
        total_results: number
    }
    ads?: unknown[]
    knowledge_graph?: unknown
    answer_box?: unknown
    related_searches?: { query: string }[]
    /** People Also Ask — legacy field name used in some SerpAPI versions */
    related_questions?: RelatedQuestion[]
    /** People Also Ask — primary field name in current SerpAPI responses */
    people_also_ask?: RelatedQuestion[]
    organic_results?: OrganicResult[]
    ai_overview?: AiOverview
    inline_videos?: unknown
    video_results?: unknown
    shopping_results?: unknown
    local_results?: unknown
    top_stories?: unknown
    inline_images?: unknown
    image_results?: unknown
}

/**
 * Adapter for fetching SEO metrics using SerpApi (Google Search Engine).
 * Note: Exact search volume requires paid add-ons; uses total_results as proxy fallback.
 */
export class SerpApiAdapter implements SeoAdapter {
    providerName = 'SerpApi';
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.SERPAPI_API_KEY || '';
    }

    /**
     * Fetches data from SerpApi.
     * @param keyword The keyword to search for.
     */
    async fetchMetrics(keyword: string, locale = 'es'): Promise<SeoMetrics | null> {
        if (!this.apiKey) {
            console.warn('SerpApiAdapter: Missing API Key.');
            return null;
        }

        // Map locale to Google country (gl) and language (hl) codes
        const gl = locale === 'en' ? 'us' : 'mx'
        const hl = locale === 'en' ? 'en' : 'es'

        try {
            const params = new URLSearchParams({
                engine: 'google',
                q: keyword,
                hl,
                gl,
                api_key: this.apiKey
            });

            const response = await fetch(`https://serpapi.com/search?${params.toString()}`);

            if (!response.ok) {
                console.error(`SerpApiAdapter: API Error ${response.status}`);
                return null;
            }

            const data = await response.json() as SerpApiResponse;

            // 1. Volume Logic
            let volume = 0;
            if (data.search_information && data.search_information.total_results) {
                const resultsStr = String(data.search_information.total_results).replace(/[^0-9]/g, '');
                volume = parseInt(resultsStr, 10) || 0;
            }

            // 2. Intelligent Difficulty Estimation (0-100)
            let difficulty = 0;
            const adCount = data.ads?.length || 0;
            difficulty += adCount * 15;

            if (volume > 10000000) difficulty += 20;
            else if (volume > 1000000) difficulty += 15;
            else if (volume > 100000) difficulty += 10;
            else if (volume > 10000) difficulty += 5;

            if (data.knowledge_graph || data.answer_box) {
                difficulty += 10;
            }

            difficulty = Math.min(100, difficulty);

            // 3. Extract SERP Features
            const relatedSearches: string[] = [];
            if (data.related_searches && Array.isArray(data.related_searches)) {
                relatedSearches.push(
                    ...data.related_searches
                        .map((item) => item.query)
                        .filter((q) => q)
                        .slice(0, 8)
                );
            }

            // SerpAPI returns PAA as "people_also_ask" (primary) or "related_questions" (legacy)
            const paaItems = data.people_also_ask ?? data.related_questions ?? [];
            const paaCount = paaItems.length;
            const paaQuestions: string[] = [];
            paaItems.forEach((item) => {
                if (item.question) paaQuestions.push(item.question);
            });

            const topUrls: string[] = [];
            if (data.organic_results && Array.isArray(data.organic_results)) {
                data.organic_results.forEach((result) => {
                    if (result.link) topUrls.push(result.link);
                });
            }

            let topDomain = '';
            if (topUrls.length > 0) {
                try {
                    const url = new URL(topUrls[0]);
                    topDomain = url.hostname;
                } catch (_e) {}
            }

            const hasAiOverview = !!data.ai_overview;
            let aiOverviewSnippet = '';
            
            if (data.ai_overview && typeof data.ai_overview === 'object') {
                const overview = data.ai_overview;
                if (overview.text_blocks && Array.isArray(overview.text_blocks)) {
                    aiOverviewSnippet = overview.text_blocks
                        .filter((block) => block.type === 'paragraph')
                        .map((block) => block.snippet)
                        .join('\n\n');
                }
            }

            const serpFeatures: string[] = [];
            if (data.inline_videos || data.video_results) serpFeatures.push('videos');
            if (data.knowledge_graph) serpFeatures.push('knowledge_graph');
            if (data.answer_box) serpFeatures.push('featured_snippet');
            if (data.shopping_results) serpFeatures.push('shopping');
            if (data.local_results) serpFeatures.push('local_pack');
            if (data.top_stories) serpFeatures.push('top_stories');
            if (data.inline_images || data.image_results) serpFeatures.push('images');

            const competitorData: { title: string; snippet: string; link: string }[] = [];
            if (data.organic_results && Array.isArray(data.organic_results)) {
                data.organic_results.slice(0, 5).forEach((result) => {
                    competitorData.push({
                        title: result.title || '',
                        snippet: result.snippet || '',
                        link: result.link || ''
                    });
                });
            }

            return {
                volume,
                difficulty,
                relatedSearches,
                paaCount,
                paaQuestions,
                topDomain,
                hasAiOverview,
                aiOverviewSnippet,
                serpFeatures,
                topUrls,
                competitorData
            };

        } catch (error) {
            console.error(`SerpApiAdapter: Error fetching "${keyword}":`, error);
            return null;
        }
    }
}
