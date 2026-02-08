/**
 * SEO metrics extracted from search engine data providers.
 * 
 * @remarks
 * Volume and difficulty may vary by provider. Additional SERP features
 * provide competitive intelligence and content optimization opportunities.
 */
export interface SeoMetrics {
    /** Estimated monthly search volume */
    volume: number;
    /** Keyword difficulty score (0-100) */
    difficulty: number;
    /** Related search queries (max 8) */
    relatedSearches?: string[];
    /** Count of "People Also Ask" questions */
    paaCount?: number;
    /** Top ranking domain for this keyword */
    topDomain?: string;
    /** Whether AI Overview is shown for this query */
    hasAiOverview?: boolean;
    /** Active SERP features (videos, images, shopping, etc.) */
    serpFeatures?: string[];
}

export interface SeoAdapter {
    providerName: string;
    fetchMetrics(keyword: string): Promise<SeoMetrics | null>;
}
