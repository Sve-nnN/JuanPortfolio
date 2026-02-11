import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PageMetric } from '@/payload-types' // This will exist after generate:types

// Mocks
const mockPayload = {
  find: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
}

vi.mock('payload', () => ({
  getPayload: vi.fn(() => Promise.resolve(mockPayload)),
  buildConfig: vi.fn((config) => config),
}))

// Mock fetch for Sitemap and PSI
global.fetch = vi.fn()

describe('CWV Monitor Script', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch sitemap and extract URLs', async () => {
    const sitemapXML = `
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://juancarlos.app/</loc></url>
        <url><loc>https://juancarlos.app/blog</loc></url>
      </urlset>
    `
    // Mock sitemap response
    ;(global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(sitemapXML),
      }),
    )

    // Placeholder for the function we will create
    const { fetchSitemapUrls } = await import('@/scripts/seo/update-cwv')
    const urls = await fetchSitemapUrls('https://juancarlos.app/sitemap.xml')

    expect(urls).toEqual(['https://juancarlos.app/', 'https://juancarlos.app/blog'])
    expect(global.fetch).toHaveBeenCalledWith('https://juancarlos.app/sitemap.xml')
  })

  it('should fetch PSI metrics for a URL', async () => {
    const psiResponse = {
      loadingExperience: {
        metrics: {
          LARGEST_CONTENTFUL_PAINT_MS: { percentile: 2500 },
          FIRST_CONTENTFUL_PAINT_MS: { percentile: 1500 },
          CUMULATIVE_LAYOUT_SHIFT_SCORE: { percentile: 10 }, // 0.1 * 100
          INTERACTION_TO_NEXT_PAINT: { percentile: 200 },
          FIRST_INPUT_DELAY_MS: { percentile: 100 },
        },
      },
      lighthouseResult: {
        categories: {
          performance: { score: 0.95 },
        },
      },
    }

    ;(global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(psiResponse),
      }),
    )

    const { fetchPageMetrics } = await import('@/scripts/seo/update-cwv')
    const metrics = await fetchPageMetrics('https://juancarlos.app/')

    expect(metrics).toEqual({
      lcp: 2.5,
      fcp: 1.5,
      cls: 0.1,
      inp: 200,
      fid: 100,
      score: 95,
    })
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('googleapis.com/pagespeedonline/v5/runPagespeed'),
    )
  })

  it('should update payload collection with metrics', async () => {
    // Mock finding existing record
    mockPayload.find.mockResolvedValue({
      docs: [],
      totalDocs: 0,
    })

    const { saveMetricsToPayload } = await import('@/scripts/seo/update-cwv')

    const metrics = {
      lcp: 2.5,
      fcp: 1.5,
      cls: 0.1,
      inp: 200,
      fid: 100,
      score: 95,
    }

    await saveMetricsToPayload('https://juancarlos.app/', metrics)

    expect(mockPayload.create).toHaveBeenCalledWith({
      collection: 'page-metrics',
      data: {
        url: 'https://juancarlos.app/',
        path: '/',
        lastScan: expect.any(String),
        mobile: metrics,
        history: [],
      },
    })
  })
})
