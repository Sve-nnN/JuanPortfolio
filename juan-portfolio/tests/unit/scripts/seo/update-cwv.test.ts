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
  it('should skip scan if updated recently', async () => {
    // Mock robust payload response
    const recentDate = new Date()
    recentDate.setDate(recentDate.getDate() - 2) // 2 days ago

    mockPayload.find.mockResolvedValueOnce({
      docs: [
        {
          id: '123',
          url: 'https://juancarlos.app/',
          lastScan: recentDate.toISOString(),
        },
      ],
      totalDocs: 1,
    })

    // Mock Payload for updateAllCWV
    const { updateAllCWV } = await import('@/scripts/seo/update-cwv')

    // We must mock global.fetch to return a valid sitemap so the loop runs
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<urlset><url><loc>https://juancarlos.app/</loc></url></urlset>'),
    })

    await updateAllCWV() // force = false by default

    // It should check payload
    expect(mockPayload.find).toHaveBeenCalled()

    // It should NOT call PSI fetchPageMetrics (which calls global.fetch again)
    // We expect EXACTLY 1 call to fetch (for the sitemap)
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('sitemap.xml'))
  })

  it('should force scan even if updated recently', async () => {
    const recentDate = new Date()
    recentDate.setDate(recentDate.getDate() - 2)

    mockPayload.find.mockResolvedValueOnce({
      docs: [
        {
          id: '123',
          url: 'https://juancarlos.app/',
          lastScan: recentDate.toISOString(),
        },
      ],
      totalDocs: 1,
    })

    const { updateAllCWV } = await import('@/scripts/seo/update-cwv')

    // 1st fetch: Sitemap
    // 2nd fetch: PSI API
    // We need to chain mocks because updateAllCWV calls fetch twice (sitemap + psi)
    const fetchMock = global.fetch as any
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve('<urlset><url><loc>https://juancarlos.app/</loc></url></urlset>'),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            lighthouseResult: { categories: { performance: { score: 1 } } },
          }),
      })

    await updateAllCWV(true) // force = true

    // Expect explicit CALLS: Sitemap (1) + PSI (1)
    // Note: Since we are appending mocks, we check calls.
    // Wait, if we use mockResolvedValueOnce, it stacks.

    // We need to ensure we are checking the RIGHT calls.
    // The spy is persistent across the test file unless cleared?
    // beforeEach clears mocks.

    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(global.fetch).toHaveBeenLastCalledWith(expect.stringContaining('googleapis.com'))
  })
})
