
import { SeoAdapter, SeoMetrics } from '../types';

/**
 * Adapter for fetching SEO metrics using the DataForSEO API.
 * Supports both Sandbox and Live endpoints based on configuration.
 */
export class DataForSeoAdapter implements SeoAdapter {
    providerName = 'DataForSEO (Sandbox)';
    private login: string;
    private password: string;

    constructor(login?: string, password?: string) {
        this.login = login || process.env.DATAFORSEO_LOGIN || '';
        this.password = password || process.env.DATAFORSEO_PASSWORD || '';
    }

    /**
     * Fetches metrics from DataForSEO Google Ads endpoint.
     * @param keyword The keyword to analyze.
     */
    async fetchMetrics(keyword: string): Promise<SeoMetrics | null> {
        if (!this.login || !this.password) {
            console.warn('DataForSeoAdapter: Missing credentials.');
            return null;
        }

        const auth = Buffer.from(`${this.login}:${this.password}`).toString('base64');

        try {
            const postData = [{
                language_name: "English",
                location_name: "United States",
                keywords: [keyword]
            }];

            const isSandbox = process.env.DATAFORSEO_SANDBOX === 'true';
            const host = isSandbox ? 'sandbox.dataforseo.com' : 'api.dataforseo.com';

            const response = await fetch(`https://${host}/v3/keywords_data/google_ads/search_volume/live`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`DataForSEO API Error: ${response.status} ${response.statusText} - ${errorText}`);
                return null;
            }

            const data = await response.json();
            const result = data.tasks?.[0]?.result?.[0];

            if (result) {
                return {
                    volume: result.search_volume || 0,
                    difficulty: result.competition_index || 0
                };
            }
            return { volume: 0, difficulty: 0 };

        } catch (error) {
            console.error(`Error fetching DataForSEO for "${keyword}":`, error);
            return null;
        }
    }
}
