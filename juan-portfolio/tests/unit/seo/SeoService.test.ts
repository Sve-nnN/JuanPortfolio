import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SeoService } from '../../../src/scripts/seo/SeoService';
import { SeoAdapter } from '../../../src/scripts/seo/types';

describe('SeoService', () => {
    let service: SeoService;
    let mockAdapter: SeoAdapter;
    let mockPayload: any;

    const MOCK_KEYWORD = 'test-keyword';
    const MOCK_METRICS = { volume: 100, difficulty: 50 };
    const NOW = new Date('2024-01-01T12:00:00Z');

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(NOW);

        mockAdapter = {
            fetchMetrics: vi.fn().mockResolvedValue(MOCK_METRICS)
        };

        mockPayload = {
            find: vi.fn(),
            create: vi.fn(),
            update: vi.fn()
        };

        service = new SeoService(mockAdapter, mockPayload);
    });

    it('should return cached metrics if valid (< 24h)', async () => {
        // Mock finding a recent record
        mockPayload.find.mockResolvedValue({
            docs: [{
                keyword: MOCK_KEYWORD,
                volume: 500,
                difficulty: 20,
                updatedAt: new Date(NOW.getTime() - 1000 * 60 * 60).toISOString() // 1 hour ago
            }]
        });

        const result = await service.getMetrics(MOCK_KEYWORD);

        expect(result).toEqual({ volume: 500, difficulty: 20 });
        expect(mockPayload.find).toHaveBeenCalled();
        expect(mockAdapter.fetchMetrics).not.toHaveBeenCalled();
    });

    it('should fetch from adapter if cache is stale (> 24h)', async () => {
        // Mock finding an old record
        const oldId = 'old-record-id';
        mockPayload.find.mockResolvedValue({
            docs: [{
                id: oldId,
                keyword: MOCK_KEYWORD,
                volume: 10,
                difficulty: 10,
                updatedAt: new Date(NOW.getTime() - 1000 * 60 * 60 * 25).toISOString() // 25 hours ago
            }]
        });

        const result = await service.getMetrics(MOCK_KEYWORD);

        expect(result).toEqual(MOCK_METRICS);
        expect(mockAdapter.fetchMetrics).toHaveBeenCalledWith(MOCK_KEYWORD);
        // Should update the existing record
        expect(mockPayload.update).toHaveBeenCalledWith(expect.objectContaining({
            id: oldId,
            collection: 'keyword-metrics',
            data: expect.objectContaining({
                volume: MOCK_METRICS.volume,
                difficulty: MOCK_METRICS.difficulty
            })
        }));
    });

    it('should fetch from adapter if not in cache', async () => {
        // Mock finding nothing
        mockPayload.find.mockResolvedValue({ docs: [] });

        const result = await service.getMetrics(MOCK_KEYWORD);

        expect(result).toEqual(MOCK_METRICS);
        expect(mockAdapter.fetchMetrics).toHaveBeenCalledWith(MOCK_KEYWORD);
        // Should create a new record
        expect(mockPayload.create).toHaveBeenCalledWith(expect.objectContaining({
            collection: 'keyword-metrics',
            data: expect.objectContaining({
                keyword: MOCK_KEYWORD,
                volume: MOCK_METRICS.volume,
                difficulty: MOCK_METRICS.difficulty
            })
        }));
    });

    it('should return adapter result even if DB save fails', async () => {
        mockPayload.find.mockResolvedValue({ docs: [] });
        mockPayload.create.mockRejectedValue(new Error('DB Error'));

        const result = await service.getMetrics(MOCK_KEYWORD);

        expect(result).toEqual(MOCK_METRICS);
    });

    it('should return null if adapter fails and no cache', async () => {
        mockPayload.find.mockResolvedValue({ docs: [] });
        // Adapter returns null
        mockAdapter.fetchMetrics = vi.fn().mockResolvedValue(null);

        const result = await service.getMetrics(MOCK_KEYWORD);

        expect(result).toBeNull();
    });
});
