import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SerpApiAdapter } from '../../../src/scripts/seo/adapters/SerpApiAdapter';

// Mocking fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('SerpApiAdapter - Enhanced SERP Features', () => {
    let adapter: SerpApiAdapter;
    const MOCK_API_KEY = 'test-api-key';

    beforeEach(() => {
        vi.resetAllMocks();
        process.env.SERPAPI_API_KEY = MOCK_API_KEY;
        adapter = new SerpApiAdapter();
    });

    // 🔴 RED: Test for Related Searches
    it('should extract related searches from SerpApi response', async () => {
        const mockResponse = {
            search_metadata: { status: 'Success' },
            search_information: { total_results: 1234567 },
            related_searches: [
                { query: 'technical seo checklist' },
                { query: 'seo for developers pdf' },
                { query: 'best technical seo tools' }
            ],
            organic_results: [
                { position: 1, link: 'https://example.com/post' }
            ]
        };

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });

        const result = await adapter.fetchMetrics('technical seo');

        expect(result).not.toBeNull();
        if (result) {
            expect(result.relatedSearches).toBeDefined();
            expect(result.relatedSearches).toHaveLength(3);
            expect(result.relatedSearches).toContain('technical seo checklist');
        }
    });

    // 🔴 RED: Test for People Also Ask (PAA)
    it('should count People Also Ask questions', async () => {
        const mockResponse = {
            search_metadata: { status: 'Success' },
            search_information: { total_results: 9876543 },
            people_also_ask: [
                { question: 'What is technical SEO?' },
                { question: 'Why is technical SEO important?' },
                { question: 'How to improve technical SEO?' },
                { question: 'What are common technical SEO issues?' }
            ],
            organic_results: [{ position: 1, link: 'https://test.com' }]
        };

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });

        const result = await adapter.fetchMetrics('technical seo basics');

        expect(result).not.toBeNull();
        if (result) {
            expect(result.paaCount).toBe(4);
        }
    });

    // 🔴 RED: Test for Top Domain extraction
    it('should extract top ranking domain from organic results', async () => {
        const mockResponse = {
            search_metadata: { status: 'Success' },
            search_information: { total_results: 5555555 },
            organic_results: [
                { position: 1, link: 'https://developers.google.com/search/docs' },
                { position: 2, link: 'https://moz.com/learn/seo' }
            ]
        };

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });

        const result = await adapter.fetchMetrics('seo guide');

        expect(result).not.toBeNull();
        if (result) {
            expect(result.topDomain).toBe('developers.google.com');
        }
    });

    // 🔴 RED: Test for AI Overview detection
    it('should detect AI Overview presence', async () => {
        const mockResponse = {
            search_metadata: { status: 'Success' },
            search_information: { total_results: 2222222 },
            ai_overview: {
                text: 'AI-generated summary of technical SEO...',
                sources: []
            },
            organic_results: [{ position: 1, link: 'https://example.com' }]
        };

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });

        const result = await adapter.fetchMetrics('what is seo');

        expect(result).not.toBeNull();
        if (result) {
            expect(result.hasAiOverview).toBe(true);
        }
    });

    // 🔴 RED: Test for SERP Features detection
    it('should detect active SERP features', async () => {
        const mockResponse = {
            search_metadata: { status: 'Success' },
            search_information: { total_results: 3333333 },
            inline_videos: [{ title: 'SEO Tutorial Video' }],
            knowledge_graph: { title: 'Search Engine Optimization' },
            answer_box: { answer: 'SEO is...' },
            organic_results: [{ position: 1, link: 'https://test.com' }]
        };

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });

        const result = await adapter.fetchMetrics('seo definition');

        expect(result).not.toBeNull();
        if (result) {
            expect(result.serpFeatures).toBeDefined();
            expect(result.serpFeatures).toContain('videos');
            expect(result.serpFeatures).toContain('knowledge_graph');
            expect(result.serpFeatures).toContain('featured_snippet');
        }
    });

    // 🔴 RED: Test for response without optional features
    it('should handle responses without optional SERP features', async () => {
        const mockResponse = {
            search_metadata: { status: 'Success' },
            search_information: { total_results: 1111111 },
            organic_results: [{ position: 1, link: 'https://minimal.com' }]
        };

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });

        const result = await adapter.fetchMetrics('niche keyword');

        expect(result).not.toBeNull();
        if (result) {
            expect(result.volume).toBe(1111111);
            expect(result.relatedSearches).toEqual([]);
            expect(result.paaCount).toBe(0);
            expect(result.topDomain).toBe('minimal.com');
            expect(result.hasAiOverview).toBe(false);
            expect(result.serpFeatures).toEqual([]);
        }
    });
});
