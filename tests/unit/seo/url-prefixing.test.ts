import { describe, it, expect } from 'vitest'
import { getPostUrl, getCategoryUrl } from '../../../src/utilities/getPostUrl'

describe('SEO URL Prefixing Rules', () => {
  describe('getPostUrl', () => {
    const mockPost = {
      slug: 'seo-guide',
      categories: [{ slug: 'tech-seo' }] as any,
    }

    it('should NOT include a prefix for Spanish (es)', () => {
      const url = getPostUrl(mockPost, 'es')
      expect(url).toBe('/blog/tech-seo/seo-guide')
      expect(url).not.toContain('/es/')
    })

    it('should include /en prefix for English (en)', () => {
      const url = getPostUrl(mockPost, 'en')
      expect(url).toBe('/en/blog/tech-seo/seo-guide')
    })

    it('should default to "general" if category is missing', () => {
      const url = getPostUrl({ slug: 'test' }, 'es')
      expect(url).toBe('/blog/general/test')
    })
  })

  describe('getCategoryUrl', () => {
    it('should NOT include a prefix for Spanish (es)', () => {
      const url = getCategoryUrl({ slug: 'tech-seo' }, 'es')
      expect(url).toBe('/blog/tech-seo')
    })

    it('should include /en prefix for English (en)', () => {
      const url = getCategoryUrl({ slug: 'tech-seo' }, 'en')
      expect(url).toBe('/en/blog/tech-seo')
    })
  })
})
