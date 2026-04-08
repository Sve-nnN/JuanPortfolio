
import { SeoAdapter, SeoMetrics } from './types';
import { BasePayload } from 'payload';

export class SeoService {
    private adapter: SeoAdapter;
    private payload: BasePayload;
    private cacheTTL: number = 24 * 60 * 60 * 1000; // 24 hours

    constructor(adapter: SeoAdapter, payload: BasePayload) {
        this.adapter = adapter;
        this.payload = payload;
    }

    async getMetrics(keyword: string): Promise<SeoMetrics | null> {
        try {
            // 1. Check Cache
            const cached = await this.payload.find({
                collection: 'keyword-metrics',
                where: { keyword: { equals: keyword } },
                limit: 1
            });

            if (cached.docs.length > 0) {
                const doc = cached.docs[0];
                const updatedAt = new Date(doc.updatedAt).getTime();
                const now = Date.now();

                if (now - updatedAt < this.cacheTTL) {
                    // Valid Cache
                    return {
                        volume: doc.volume,
                        difficulty: doc.difficulty
                    };
                }

                // Stale Cache - fetch and update
                console.log(`Cache stale for "${keyword}". Fetching fresh data...`);
                const metrics = await this.adapter.fetchMetrics(keyword);
                if (metrics) {
                    await this.payload.update({
                        collection: 'keyword-metrics',
                        id: doc.id,
                        data: {
                            volume: metrics.volume,
                            difficulty: metrics.difficulty,
                            source: 'adapter-refresh'
                        }
                    });
                    return metrics;
                }

                // If fetch fails, return partial stale data? Or null?
                // Start with returning stale data if fetch fails?
                // The requirements didn't specify fallback to stale, but it's a good practice.
                // However, the test expects adapter result.
                // Let's stick to returning what adapter returns, 
                // but actually, if adapter returns null, we probably should keep old data?
                // For now, implementing simple logic: if adapter fails, return null (consistent with failures).
            }

            // 2. No Cache - Fetch New
            const metrics = await this.adapter.fetchMetrics(keyword);
            if (metrics) {
                try {
                    await this.payload.create({
                        collection: 'keyword-metrics',
                        data: {
                            keyword,
                            volume: metrics.volume,
                            difficulty: metrics.difficulty,
                            source: 'adapter-new'
                        }
                    });
                } catch (dbError) {
                    console.error('Failed to cache metrics:', dbError);
                }
                return metrics;
            }

            return null;

        } catch (error) {
            console.error('SeoService Error:', error);
            // Fallback to adapter if DB fails completely
            return this.adapter.fetchMetrics(keyword);
        }
    }
}
