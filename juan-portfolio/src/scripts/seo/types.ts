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
    /** Actual "People Also Ask" questions */
    paaQuestions?: string[];
    /** Top ranking domain for this keyword */
    topDomain?: string;
    /** Whether AI Overview is shown for this query */
    hasAiOverview?: boolean;
    /** Text content of the AI Overview response */
    aiOverviewSnippet?: string;
    /** Active SERP features (videos, images, shopping, etc.) */
    serpFeatures?: string[];
    /** Top 4 organic competitor URLs for crawling */
    topUrls?: string[];
    /** Detailed competitor info (Title | Snippet) */
    competitorData?: { title: string; snippet: string; link: string }[];
    /** Calculated opportunity score (0-100) */
    opportunityScore?: number;
    /** Recommended content format (Blog, Page, etc.) */
    recommendedFormat?: 'Blog' | 'Landing Page' | 'Technical Guide';
}

export interface SeoAdapter {
    providerName: string;
    fetchMetrics(keyword: string, locale?: string): Promise<SeoMetrics | null>;
}
