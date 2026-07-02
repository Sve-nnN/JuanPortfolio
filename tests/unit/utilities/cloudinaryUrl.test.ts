import { describe, it, expect } from 'vitest'
import {
  getOptimizedCloudinaryUrl,
  getCloudinaryOgWithTitle,
} from '../../../src/utilities/cloudinaryUrl'

// ---------------------------------------------------------------------------
// getOptimizedCloudinaryUrl (existing function, regression suite)
// ---------------------------------------------------------------------------

describe('getOptimizedCloudinaryUrl', () => {
  const BASE = 'https://res.cloudinary.com/dmufha3qv/image/upload/v123/portfolio/photo.jpg'

  it('returns empty string for null/undefined', () => {
    expect(getOptimizedCloudinaryUrl(null)).toBe('')
    expect(getOptimizedCloudinaryUrl(undefined)).toBe('')
  })

  it('returns original URL for non-Cloudinary URLs', () => {
    const url = 'https://example.com/image.jpg'
    expect(getOptimizedCloudinaryUrl(url)).toBe(url)
  })

  it('injects format and quality when no dimensions given', () => {
    const result = getOptimizedCloudinaryUrl(BASE)
    expect(result).toContain('/upload/f_avif,q_auto/')
  })

  it('injects width, height, crop, format, quality', () => {
    const result = getOptimizedCloudinaryUrl(BASE, {
      width: 800,
      height: 400,
      crop: 'fill',
      format: 'webp',
      quality: '80',
    })
    expect(result).toContain('w_800,h_400,c_fill,f_webp,q_80')
  })
})

// ---------------------------------------------------------------------------
// getCloudinaryOgWithTitle
// ---------------------------------------------------------------------------

describe('getCloudinaryOgWithTitle', () => {
  const CLOUD = 'https://res.cloudinary.com/dmufha3qv'
  const RAW_URL = `${CLOUD}/image/upload/v1770675677/portfolio/fallback-image-1.avif`
  const WITH_TRANSFORMS = `${CLOUD}/image/upload/f_avif,q_auto/v1770675677/portfolio/fallback-image-1.avif`
  const NO_VERSION = `${CLOUD}/image/upload/portfolio/photo.jpg`
  const ALREADY_OG = `${CLOUD}/image/upload/w_1200,h_630,c_center/portfolio/og.jpg`

  // ── Guard-rail cases ────────────────────────────────────────────────────

  it('returns the original URL unchanged when it is not a Cloudinary URL', () => {
    const url = 'https://example.com/image.jpg'
    expect(getCloudinaryOgWithTitle(url, 'My Page')).toBe(url)
  })

  it('returns empty string for empty input', () => {
    expect(getCloudinaryOgWithTitle('', 'Title')).toBe('')
  })

  it('returns the original URL unchanged when /upload/ is not present', () => {
    const url = 'https://res.cloudinary.com/dmufha3qv/raw/authenticated/Array-Bold.woff2'
    expect(getCloudinaryOgWithTitle(url, 'Title')).toBe(url)
  })

  // ── Transformation structure ────────────────────────────────────────────

  it('applies standard 1200×630 OG base transform', () => {
    const result = getCloudinaryOgWithTitle(RAW_URL, 'Hello World')
    expect(result).toContain('w_1200,h_630,c_fill,g_auto,f_jpg,q_auto')
    // q_auto:85 is invalid in Cloudinary — must not appear
    expect(result).not.toContain('q_auto:85')
  })

  it('applies the scrim overlay layer before the text', () => {
    const result = getCloudinaryOgWithTitle(RAW_URL, 'Hello World')
    expect(result).toContain('l_portfolio:og-scrim')
    // Scrim must appear BEFORE the text layer in the URL
    const scrimIdx = result.indexOf('l_portfolio:og-scrim')
    const textIdx = result.indexOf('l_text:')
    expect(scrimIdx).toBeLessThan(textIdx)
  })

  it('applies the scrim at full width (1200) and 300px height at the bottom', () => {
    const result = getCloudinaryOgWithTitle(RAW_URL, 'Hello World')
    expect(result).toContain('l_portfolio:og-scrim/w_1200,h_300,c_fill/fl_layer_apply,g_south')
  })

  it('applies the Array-Bold.woff2 custom font at 70px with right alignment', () => {
    const result = getCloudinaryOgWithTitle(RAW_URL, 'Hello World')
    expect(result).toContain('l_text:Array-Bold.woff2_70_right:')
  })

  it('positions text bottom-right with 50px inset via fl_layer_apply', () => {
    const result = getCloudinaryOgWithTitle(RAW_URL, 'Hello World')
    expect(result).toContain('fl_layer_apply,g_south_east,x_50,y_50')
  })

  it('constrains text width to 1100px with c_fit', () => {
    const result = getCloudinaryOgWithTitle(RAW_URL, 'Hello World')
    expect(result).toContain('w_1100,c_fit')
  })

  it('outputs a JPEG (f_jpg in base transform)', () => {
    const result = getCloudinaryOgWithTitle(RAW_URL, 'Hello World')
    expect(result).toContain('f_jpg')
  })

  it('does NOT use the deprecated q_auto:85 format', () => {
    const result = getCloudinaryOgWithTitle(RAW_URL, 'Hello World')
    expect(result).not.toContain('q_auto:85')
  })

  // ── Public-id extraction ────────────────────────────────────────────────

  it('preserves the version + public_id at the end of the URL', () => {
    const result = getCloudinaryOgWithTitle(RAW_URL, 'Title')
    expect(result).toMatch(/v1770675677\/portfolio\/fallback-image-1\.avif$/)
  })

  it('strips existing transform segments and rebuilds correctly', () => {
    const result = getCloudinaryOgWithTitle(WITH_TRANSFORMS, 'Title')
    // Should NOT contain the original f_avif transform as a standalone segment
    expect(result).not.toContain('f_avif,q_auto/f_avif')
    // Should contain the OG transform instead
    expect(result).toContain('w_1200,h_630')
    // Original public_id must still be present
    expect(result).toMatch(/v1770675677\/portfolio\/fallback-image-1\.avif$/)
  })

  it('handles URLs without a version segment (no v\\d+)', () => {
    const result = getCloudinaryOgWithTitle(NO_VERSION, 'Title')
    expect(result).toMatch(/portfolio\/photo\.jpg$/)
    expect(result).toContain('w_1200,h_630')
  })

  it('strips an existing OG crop transform and replaces it', () => {
    const result = getCloudinaryOgWithTitle(ALREADY_OG, 'Title')
    expect(result).not.toContain('c_center')
    expect(result).toContain('c_fill')
    expect(result).toMatch(/portfolio\/og\.jpg$/)
  })

  it('retains the cloud-name and /image/upload/ prefix', () => {
    const result = getCloudinaryOgWithTitle(RAW_URL, 'Title')
    expect(result).toMatch(/^https:\/\/res\.cloudinary\.com\/dmufha3qv\/image\/upload\//)
  })

  // ── Title encoding ──────────────────────────────────────────────────────

  it('URL-encodes spaces in the title', () => {
    const result = getCloudinaryOgWithTitle(RAW_URL, 'Hello World')
    expect(result).toContain('Hello%20World')
  })

  it('URL-encodes accented characters', () => {
    const result = getCloudinaryOgWithTitle(RAW_URL, 'Guía de SEO')
    expect(result).toContain('Gu%C3%ADa')
  })

  it('DOUBLE-encodes commas (Cloudinary l_text delimiters) — %252C, not %2C', () => {
    // A single-encoded comma (%2C) decodes back to a raw delimiter and returns
    // HTTP 400; it must be double-encoded to survive as literal text. Issue #86.
    const result = getCloudinaryOgWithTitle(RAW_URL, 'Foo, Bar')
    expect(result).toContain('%252C')
    // the text token must not contain a bare single-encoded comma
    const textToken = (result.split('l_text:')[1] ?? '').split(',co_white')[0]
    expect(textToken).not.toMatch(/%2C(?!5)/)
  })

  it('DOUBLE-encodes slashes in the title — %252F, not %2F', () => {
    const result = getCloudinaryOgWithTitle(RAW_URL, 'A/B Test')
    expect(result).toContain('%252F')
  })

  // ── Title truncation ────────────────────────────────────────────────────

  it('passes through titles of 65 characters or fewer unchanged', () => {
    const title = 'A'.repeat(65)
    const result = getCloudinaryOgWithTitle(RAW_URL, title)
    expect(result).toContain(encodeURIComponent(title))
  })

  it('truncates titles longer than 65 characters and appends ellipsis', () => {
    const title = 'A'.repeat(80)
    const result = getCloudinaryOgWithTitle(RAW_URL, title)
    const expected = encodeURIComponent('A'.repeat(62) + '...')
    expect(result).toContain(expected)
    expect(result).not.toContain(encodeURIComponent(title))
  })

  it('truncates at exactly 66 characters (boundary)', () => {
    const title = 'B'.repeat(66)
    const result = getCloudinaryOgWithTitle(RAW_URL, title)
    expect(result).toContain(encodeURIComponent('B'.repeat(62) + '...'))
  })
})
