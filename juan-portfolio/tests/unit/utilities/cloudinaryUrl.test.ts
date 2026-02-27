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

  it('applies the Array-Bold.woff2 custom font text layer', () => {
    const result = getCloudinaryOgWithTitle(RAW_URL, 'Hello World')
    expect(result).toContain('l_text:Array-Bold.woff2_54:')
  })

  it('positions text bottom-left with correct gravity and offset', () => {
    const result = getCloudinaryOgWithTitle(RAW_URL, 'Hello World')
    expect(result).toContain('g_south_west,x_60,y_55')
  })

  it('constrains text width with c_fit', () => {
    const result = getCloudinaryOgWithTitle(RAW_URL, 'Hello World')
    expect(result).toContain('w_1080,c_fit')
  })

  it('outputs a JPEG (f_jpg in base transform)', () => {
    const result = getCloudinaryOgWithTitle(RAW_URL, 'Hello World')
    expect(result).toContain('f_jpg')
  })

  // ── Public-id extraction ────────────────────────────────────────────────

  it('preserves the version + public_id at the end of the URL', () => {
    const result = getCloudinaryOgWithTitle(RAW_URL, 'Title')
    expect(result).toMatch(/v1770675677\/portfolio\/fallback-image-1\.avif$/)
  })

  it('strips existing transform segments and rebuilds correctly', () => {
    const result = getCloudinaryOgWithTitle(WITH_TRANSFORMS, 'Title')
    // Should NOT contain the original f_avif transform
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
    // w_1200,h_630,c_center must be stripped; new OG transform applied
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

  it('URL-encodes commas (which are Cloudinary delimiters)', () => {
    const result = getCloudinaryOgWithTitle(RAW_URL, 'Foo, Bar')
    expect(result).toContain('%2C')
  })

  it('URL-encodes slashes in the title', () => {
    const result = getCloudinaryOgWithTitle(RAW_URL, 'A/B Test')
    expect(result).toContain('%2F')
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
    // The original full title must NOT appear
    expect(result).not.toContain(encodeURIComponent(title))
  })

  it('truncates at exactly 66 characters (boundary)', () => {
    const title = 'B'.repeat(66)
    const result = getCloudinaryOgWithTitle(RAW_URL, title)
    expect(result).toContain(encodeURIComponent('B'.repeat(62) + '...'))
  })
})
