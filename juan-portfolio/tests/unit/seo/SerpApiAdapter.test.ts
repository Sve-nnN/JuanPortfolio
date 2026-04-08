import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SerpApiAdapter } from '../../../src/scripts/seo/adapters/SerpApiAdapter';

// Mocking fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('SerpApiAdapter', () => {
    let adapter: SerpApiAdapter;
    const MOCK_API_KEY = 'test-api-key';

    beforeEach(() => {
        vi.resetAllMocks();
        process.env.SERPAPI_API_KEY = MOCK_API_KEY;
        adapter = new SerpApiAdapter();
    });

    it('should return null if API key is missing', async () => {
        delete process.env.SERPAPI_API_KEY;
        const noKeyAdapter = new SerpApiAdapter();
        const result = await noKeyAdapter.fetchMetrics('test');
        expect(result).toBeNull();
    });

    it('should fetch metrics successfully from SerpApi', async () => {
        const mockResponse = {
            search_metadata: { status: 'Success' },
            error: null,
            search_information: {
                total_results: 1230000
            },
            organic_results: [
                { link: 'https://test.com/1' },
                { link: 'https://test.com/2' }
            ]
        };

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });

        const result = await adapter.fetchMetrics('test keyword');

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('https://serpapi.com/search')
        );
        expect(result).not.toBeNull();
        if (result) {
            expect(result.volume).toBeGreaterThan(0);
            expect(result.topUrls).toEqual(['https://test.com/1', 'https://test.com/2']);
        }
    });

    it('should handle API errors gracefully', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 401,
            text: async () => 'Unauthorized',
        });

        const result = await adapter.fetchMetrics('fail');
        expect(result).toBeNull();
    });
});
