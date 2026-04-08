
import { SeoAdapter, SeoMetrics } from '../types';

/**
 * Adapter for fetching SEO metrics using the Google Ads API.
 * Uses the `generateKeywordHistoricalMetrics` endpoint.
 */
export class GoogleAdsAdapter implements SeoAdapter {
    providerName = 'Google Ads (Sandbox)';
    private developerToken: string;
    private customerId: string;
    private clientId: string;
    private clientSecret: string;
    private refreshToken: string;
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    constructor() {
        this.developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '';
        this.customerId = process.env.GOOGLE_ADS_CUSTOMER_ID || '';
        this.clientId = process.env.GOOGLE_ADS_CLIENT_ID || '';
        this.clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET || '';
        this.refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN || '';
    }

    private async getAccessToken(): Promise<string | null> {
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    refresh_token: this.refreshToken,
                    grant_type: 'refresh_token'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('GoogleAdsAdapter: Failed to refresh token:', errorText);
                return null;
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Buffer 1 min
            return this.accessToken;
        } catch (error) {
            console.error('GoogleAdsAdapter: Error refreshing token:', error);
            return null;
        }
    }

    /**
     * Fetches search volume and difficulty (competition index) for a keyword.
     * @param keyword The keyword to analyze.
     * @returns SeoMetrics with volume and difficulty, or null if failed/invalid.
     */
    async fetchMetrics(keyword: string): Promise<SeoMetrics | null> {
        if (!this.developerToken || !this.customerId || !this.clientId || !this.clientSecret || !this.refreshToken) {
            // Validate silently to allow fallback usage
            return null;
        }

        const accessToken = await this.getAccessToken();
        if (!accessToken) return null;

        // Strip non-numeric from customerId
        const cleanCustomerId = this.customerId.replace(/-/g, '');

        try {
            const url = `https://googleads.googleapis.com/v18/customers/${cleanCustomerId}:generateKeywordHistoricalMetrics`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'developer-token': this.developerToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    keywordPlanNetwork: "GOOGLE_SEARCH",
                    keywords: [keyword],
                    includeAdultKeywords: false,
                    geoTargetConstants: ["geoTargetConstants/2840"], // USA
                    keywordAnnotation: ["KEYWORD_CONCEPT"]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`GoogleAdsAdapter: API Error ${response.status} - ${errorText}`);
                return null;
            }

            const data = await response.json();
            const result = data.results?.[0];

            if (result && result.keywordMetrics) {
                const metrics = result.keywordMetrics;
                // avgMonthlySearches might be exact or just null if low volume
                const volume = metrics.avgMonthlySearches ? parseInt(metrics.avgMonthlySearches) : 0;

                // Google returns competition as 'LOW', 'MEDIUM', 'HIGH' or competitionIndex (0-100)
                const difficulty = metrics.competitionIndex ? parseInt(metrics.competitionIndex) : 0;

                return {
                    volume: volume,
                    difficulty: difficulty
                };
            }
            return { volume: 0, difficulty: 0 };

        } catch (error) {
            console.error(`GoogleAdsAdapter: Error fetching "${keyword}":`, error);
            return null;
        }
    }
}
