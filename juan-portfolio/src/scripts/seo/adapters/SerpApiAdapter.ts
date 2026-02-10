import { SeoAdapter, SeoMetrics } from '../types';

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

            const data = await response.json();

            // 1. Volume Logic
            // SerpApi standard search doesn't give "Search Volume" directly without extra paid add-ons.
            // Proxy: total_results
            let volume = 0;
            if (data.search_information && data.search_information.total_results) {
                const resultsStr = String(data.search_information.total_results).replace(/[^0-9]/g, '');
                volume = parseInt(resultsStr) || 0;
            }

            // 2. Intelligent Difficulty Estimation (0-100)
            // Since standard SERP doesn't give difficulty, we estimate it:
            // Factors: Number of ads, total results volume, presence of knowledge graph, presence of top competitors.
            let difficulty = 0;
            
            // Factor A: Commercial Intent (Ads) - High impact
            const adCount = data.ads?.length || 0;
            difficulty += adCount * 15; // Up to 60-75 points for many ads

            // Factor B: Competition Volume (Total results)
            if (volume > 10000000) difficulty += 20;
            else if (volume > 1000000) difficulty += 15;
            else if (volume > 100000) difficulty += 10;
            else if (volume > 10000) difficulty += 5;

            // Factor C: Informational Authority (Knowledge Graph / Answer Box)
            if (data.knowledge_graph || data.answer_box) {
                difficulty += 10; // Harder to rank if Google already answers it
            }

            // Cap at 100
            difficulty = Math.min(100, difficulty);

            // 3. Extract SERP Features
            const relatedSearches: string[] = [];
            if (data.related_searches && Array.isArray(data.related_searches)) {
                relatedSearches.push(
                    ...data.related_searches
                        .map((item: { query: string }) => item.query)
                        .filter((q: string) => q)
                        .slice(0, 8)
                );
            }

            const paaCount = data.people_also_ask?.length || 0;

            let topDomain = '';
            let competitorTitle = '';
            let competitorDescription = '';

            if (data.organic_results && data.organic_results.length > 0) {
                const topResult = data.organic_results[0];
                competitorTitle = topResult.title || '';
                competitorDescription = topResult.snippet || '';
                
                try {
                    const topLink = topResult.link;
                    const url = new URL(topLink);
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
                topDomain,
                hasAiOverview,
                serpFeatures,
                competitorTitle,
                competitorDescription
            };

        } catch (error) {
            console.error(`SerpApiAdapter: Error fetching "${keyword}":`, error);
            return null;
        }
    }
}
