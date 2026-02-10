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
            }
        };

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });

        // NOTE: Since SerpApi standard search doesn't give volume, 
        // our adapter might just return 0 volume but confirm it "worked" 
        // or we might parse "About 1,230,000 results" as a proxy for raw volume (rough estimate).
        // Let's assume for this TDD that we want to try to parse total results as a fallback volume 
        // (SerpApi doesn't give precise monthly volume without paid granular API).

        const result = await adapter.fetchMetrics('test keyword');

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('https://serpapi.com/search')
        );
        expect(result).not.toBeNull();
        if (result) {
            // We expect it to parse "1,230,000" -> 1230000
            expect(result.volume).toBeGreaterThan(0);
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
