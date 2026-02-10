
import { describe, it, expect, vi } from 'vitest'
import { SerpApiAdapter } from '../../../src/scripts/seo/adapters/SerpApiAdapter'

describe('SerpApiAdapter', () => {
    it('should parse standard Google search results correctly', async () => {
        const adapter = new SerpApiAdapter();
        
        // Mock fetch to simulate SerpApi response
        const mockResponse = {
            search_information: {
                total_results: 1230000
            },
            related_searches: [
                { query: 'test related 1' },
                { query: 'test related 2' }
            ],
            people_also_ask: [
                { question: 'q1' },
                { question: 'q2' }
            ],
            organic_results: [
                { 
                    link: 'https://example.com/page1',
                    title: 'Web performance - MDN Web Docs - Mozilla',
                    snippet: 'Web performance is how long a site takes to load...'
                }
            ],
            inline_videos: [{}],
            knowledge_graph: { title: 'Test' }
        };

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const metrics = await adapter.fetchMetrics('test keyword');

        expect(metrics).not.toBeNull();
        expect(metrics?.volume).toBe(1230000);
        expect(metrics?.relatedSearches).toContain('test related 1');
        expect(metrics?.paaCount).toBe(2);
        expect(metrics?.topDomain).toBe('example.com');
        expect(metrics?.competitorTitle).toBe('Web performance - MDN Web Docs - Mozilla');
        expect(metrics?.competitorDescription).toContain('Web performance is how long');
        expect(metrics?.serpFeatures).toContain('videos');
        expect(metrics?.serpFeatures).toContain('knowledge_graph');
    })

    it('should calculate an estimated difficulty based on results and ads', async () => {
        const adapter = new SerpApiAdapter();
        
        const mockResponse = {
            search_information: { total_results: 5000000 },
            ads: [{}, {}, {}], // 3 ads
            organic_results: [{ link: 'https://example.com' }]
        };

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const metrics = await adapter.fetchMetrics('hard keyword');
        // We expect some non-zero difficulty now if we implement the estimation
        expect(metrics?.difficulty).toBeGreaterThan(0);
    })
})
