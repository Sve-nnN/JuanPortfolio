import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock dependencies
const mockFind = vi.fn()
const mockGetPayload = vi.fn()

vi.mock('payload', () => ({
  getPayload: mockGetPayload,
}))

// Mock next-sitemap
vi.mock('next-sitemap', () => ({
  getServerSideSitemap: vi.fn((sitemap) => ({
    props: { sitemap },
  })),
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  unstable_cache: (fn) => fn,
}))

// Mock config
vi.mock('@payload-config', () => ({
  default: {},
}))

describe('Sitemaps', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPayload.mockResolvedValue({
      find: mockFind,
    })
  })

  // We need to import the route handlers dynamically to apply mocks

  describe('Categories Sitemap', () => {
    it('should generate sitemap entries for categories', async () => {
      const { GET } = await import('@/app/(frontend)/(sitemaps)/categories-sitemap.xml/route')

      mockFind.mockResolvedValueOnce({
        docs: [
          { slug: 'tech', updatedAt: '2023-01-01T00:00:00.000Z' },
          { slug: 'life', updatedAt: '2023-02-01T00:00:00.000Z' },
        ],
      })

      const response: any = await GET()
      // getServerSideSitemap returns an object with props in our mock (which isn't exactly what it does in pages dir but close enough for testing logic)
      // Actually getServerSideSitemap in app dir usually returns a Response object.
      // But let's check what we passed to it.
      // The implementation calls getServerSideSitemap(sitemap)

      // Since we mocked getServerSideSitemap to return { props: { sitemap } }, we can inspect that.
      // However, the `GET` function is async and returns whatever getServerSideSitemap returns.

      const sitemapData = response.props.sitemap

      expect(sitemapData).toHaveLength(2)
      expect(sitemapData[0].loc).toContain('/blog/category/tech')
      expect(sitemapData[1].loc).toContain('/blog/category/life')
    })
  })

  describe('Authors Sitemap', () => {
    it('should generate sitemap entries for authors', async () => {
      // Reset modules to ensure fresh import if needed, but vitest usually handles isolation
      const { GET } = await import('@/app/(frontend)/(sitemaps)/authors-sitemap.xml/route')

      mockFind.mockResolvedValueOnce({
        docs: [{ slug: 'juan-carlos', updatedAt: '2023-01-01T00:00:00.000Z' }],
      })

      const response: any = await GET()
      const sitemapData = response.props.sitemap

      expect(sitemapData).toHaveLength(1)
      expect(sitemapData[0].loc).toContain('/authors/juan-carlos')
    })
  })
})
