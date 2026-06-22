import { describe, it, expect } from 'vitest'
import { getCloudinaryOgJpg } from '@/utilities/cloudinaryUrl'

/**
 * Regression suite for SEO audit jun-2026 issue #33: explicit Cloudinary OG
 * images (often .avif) must be served as 1200×630 JPG so social scrapers
 * (Facebook/LinkedIn/X) render the preview.
 */
describe('getCloudinaryOgJpg (issue #33)', () => {
  it('coerces an avif Cloudinary URL to a 1200x630 jpg', () => {
    const out = getCloudinaryOgJpg(
      'https://res.cloudinary.com/demo/image/upload/f_avif,q_auto/v1770/portfolio/juan-angulo-portrait.avif',
    )
    expect(out).toContain('f_jpg')
    expect(out).toContain('w_1200,h_630,c_fill')
    expect(out).not.toContain('f_avif')
    // public_id (incl. version) preserved
    expect(out).toContain('/v1770/portfolio/juan-angulo-portrait.avif')
  })

  it('strips pre-existing transform segments', () => {
    const out = getCloudinaryOgJpg(
      'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_thumb/portfolio/pic.png',
    )
    expect(out).not.toContain('w_400')
    expect(out).toContain('w_1200,h_630,c_fill,g_auto,f_jpg,q_auto/portfolio/pic.png')
  })

  it('leaves non-Cloudinary URLs unchanged', () => {
    const url = 'https://example.com/og.png'
    expect(getCloudinaryOgJpg(url)).toBe(url)
  })
})
