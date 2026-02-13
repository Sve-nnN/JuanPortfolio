import { SeoAdapter, SeoMetrics } from '../types';

interface SerpApiResult {
    question?: string
    link?: string
}

interface SerpApiResponse {
    search_information?: {
        total_results: number
    }
    ads?: any[]
    knowledge_graph?: any
    answer_box?: any
    related_searches?: { query: string }[]
    people_also_ask?: SerpApiResult[]
    organic_results?: SerpApiResult[]
    ai_overview?: any
    inline_videos?: any
    video_results?: any
    shopping_results?: any
    local_results?: any
    top_stories?: any
    inline_images?: any
    image_results?: any
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
    async fetchMetrics(keyword: string): Promise<SeoMetrics | null> {
        if (!this.apiKey) {
            console.warn('SerpApiAdapter: Missing API Key.');
            return null;
        }

        try {
            const params = new URLSearchParams({
                engine: 'google',
                q: keyword,
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

            const paaCount = data.people_also_ask?.length || 0;
            const paaQuestions: string[] = [];
            if (data.people_also_ask && Array.isArray(data.people_also_ask)) {
                data.people_also_ask.forEach((item) => {
                    if (item.question) paaQuestions.push(item.question);
                });
            }

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

            const serpFeatures: string[] = [];
            if (data.inline_videos || data.video_results) serpFeatures.push('videos');
            if (data.knowledge_graph) serpFeatures.push('knowledge_graph');
            if (data.answer_box) serpFeatures.push('featured_snippet');
            if (data.shopping_results) serpFeatures.push('shopping');
            if (data.local_results) serpFeatures.push('local_pack');
            if (data.top_stories) serpFeatures.push('top_stories');
            if (data.inline_images || data.image_results) serpFeatures.push('images');

            return {
                volume,
                difficulty,
                relatedSearches,
                paaCount,
                paaQuestions,
                topDomain,
                hasAiOverview,
                serpFeatures,
                topUrls
            };

        } catch (error) {
            console.error(`SerpApiAdapter: Error fetching "${keyword}":`, error);
            return null;
        }
    }
}
