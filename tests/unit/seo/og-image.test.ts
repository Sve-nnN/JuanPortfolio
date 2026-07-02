import { describe, it, expect } from 'vitest'
import { getCloudinaryOgJpg, getCloudinaryOgWithTitle } from '@/utilities/cloudinaryUrl'

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

/**
 * Regression suite for issue #86: commas (and slashes) in the title of an
 * l_text overlay must be DOUBLE-encoded, otherwise Cloudinary decodes them into
 * transformation-parameter separators and returns HTTP 400.
 */
describe('getCloudinaryOgWithTitle comma encoding (issue #86)', () => {
  const base = 'https://res.cloudinary.com/demo/image/upload/v1770/portfolio/fallback.avif'

  it('double-encodes commas in the title (%252C, not raw or %2C)', () => {
    const out = getCloudinaryOgWithTitle(base, 'Árboles binarios: tipos, BST, AVL')
    const textLayer = out.split('/').find((s) => s.startsWith('l_text:')) ?? ''
    expect(textLayer).toContain('%252C')
    // no raw comma and no single-encoded comma inside the text token
    const token = textLayer.slice('l_text:'.length).split(',co_white')[0]
    expect(token).not.toMatch(/,/)
    expect(token).not.toMatch(/%2C(?!5)/) // no bare %2C (only %252C allowed)
  })

  it('double-encodes slashes in the title', () => {
    const out = getCloudinaryOgWithTitle(base, 'CSR/SSR')
    const textLayer = out.split('/').find((s) => s.startsWith('l_text:')) ?? ''
    expect(textLayer).toContain('%252F')
  })

  it('leaves comma-free titles working and non-Cloudinary URLs unchanged', () => {
    const out = getCloudinaryOgWithTitle(base, 'Titulo simple')
    expect(out).toContain('l_text:')
    expect(getCloudinaryOgWithTitle('https://example.com/x.png', 'a, b')).toBe(
      'https://example.com/x.png',
    )
  })
})
