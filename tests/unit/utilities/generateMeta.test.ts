import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Media } from '../../../src/payload-types'

// ── Module mocks ─────────────────────────────────────────────────────────────
vi.mock('../../../src/utilities/getURL', () => ({
  getServerSideURL: () => 'https://juanangulo.dev',
}))

vi.mock('../../../src/utilities/mergeOpenGraph', () => ({
  mergeOpenGraph: vi.fn((og) => ({ ...og, type: 'website' })),
}))

vi.mock('../../../src/constants/fallbackImages', () => ({
  getFallbackBySlug: vi.fn(
    (slug: string) =>
      `https://res.cloudinary.com/dmufha3qv/image/upload/v1/portfolio/fallback-${slug}.avif`,
  ),
}))

// Expose a spy on getCloudinaryOgWithTitle so we can inspect calls
const mockGetCloudinaryOgWithTitle = vi.fn((url: string, _title: string) => `${url}?og=1`)

vi.mock('../../../src/utilities/cloudinaryUrl', () => ({
  getCloudinaryOgWithTitle: (url: string, title: string) =>
    mockGetCloudinaryOgWithTitle(url, title),
  getOptimizedCloudinaryUrl: vi.fn((url: string) => url),
  // getExplicitOgImageURL normalizes explicit OG images to 1200x630 JPG via
  // this helper; identity passthrough keeps the "no overlay" assertions valid.
  getCloudinaryOgJpg: vi.fn((url: string) => url),
}))

// Import AFTER mocks are set up
import { generateMeta } from '../../../src/utilities/generateMeta'
import { getFallbackBySlug } from '../../../src/constants/fallbackImages'

// ── Helpers ───────────────────────────────────────────────────────────────────

const cloudinaryUrl = 'https://res.cloudinary.com/dmufha3qv/image/upload/v1/portfolio/hero.jpg'

function makeMedia(overrides: Partial<Media> = {}): Media {
  return {
    id: 'media-1',
    url: '/media/hero.jpg',
    cloudinaryUrl,
    updatedAt: '2024-01-01T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  } as Media
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('generateMeta', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the mock to its default implementation
    mockGetCloudinaryOgWithTitle.mockImplementation(
      (url: string, _title: string) => `${url}?og=1`,
    )
  })

  // ── Title resolution ────────────────────────────────────────────────────

  it('uses meta.title when available', async () => {
    const meta = await generateMeta({
      doc: { title: 'Doc Title', meta: { title: 'Meta Title' } } as any,
      locale: 'es',
    })
    expect(meta.title).toBe('Meta Title')
  })

  it('falls back to doc.title when meta.title is absent', async () => {
    const meta = await generateMeta({
      doc: { title: 'Doc Title', slug: 'doc-title' } as any,
      locale: 'es',
    })
    expect(meta.title).toBe('Doc Title')
  })

  it('falls back to "Juan Carlos Angulo" when both are absent', async () => {
    const meta = await generateMeta({ doc: null, locale: 'es' })
    expect(meta.title).toBe('Juan Carlos Angulo')
  })

  // ── Canonical / alternates ──────────────────────────────────────────────

  it('generates Spanish canonical for es locale', async () => {
    const meta = await generateMeta({
      doc: { title: 'T', slug: 'test-post' } as any,
      locale: 'es',
      path: '/blog/test-post',
    })
    expect(meta.alternates?.canonical).toBe('https://juanangulo.dev/blog/test-post')
  })

  it('generates English canonical for en locale', async () => {
    const meta = await generateMeta({
      doc: { title: 'T', slug: 'test-post' } as any,
      locale: 'en',
      path: '/blog/test-post',
    })
    expect(meta.alternates?.canonical).toBe('https://juanangulo.dev/en/blog/test-post')
  })

  // ── OG image: explicit image set ────────────────────────────────────────

  it('uses the cloudinaryUrl from an explicit meta OG image (no overlay)', async () => {
    const image = makeMedia({ cloudinaryUrl })
    const meta = await generateMeta({
      doc: { title: 'Post', slug: 'my-post', meta: { image } } as any,
      locale: 'es',
    })
    const images = (meta.openGraph as any)?.images
    expect(images?.[0]?.url).toBe(cloudinaryUrl)
    // getCloudinaryOgWithTitle must NOT be called for explicit OG images
    expect(mockGetCloudinaryOgWithTitle).not.toHaveBeenCalled()
  })

  it('falls back to serverUrl + sizes.og.url when cloudinaryUrl is absent', async () => {
    const image = makeMedia({
      cloudinaryUrl: undefined,
      sizes: { og: { url: '/media/photo-og.jpg', width: 1200, height: 630, mimeType: 'image/jpeg', filesize: 1000, filename: 'photo-og.jpg' } },
    } as any)
    const meta = await generateMeta({
      doc: { title: 'Post', slug: 'post', meta: { image } } as any,
      locale: 'es',
    })
    const images = (meta.openGraph as any)?.images
    expect(images?.[0]?.url).toBe('https://juanangulo.dev/media/photo-og.jpg')
    expect(mockGetCloudinaryOgWithTitle).not.toHaveBeenCalled()
  })

  it('falls back to serverUrl + image.url when cloudinaryUrl and og size are absent', async () => {
    const image = makeMedia({ cloudinaryUrl: undefined, url: '/media/raw.jpg', sizes: undefined } as any)
    const meta = await generateMeta({
      doc: { title: 'Post', slug: 'post', meta: { image } } as any,
      locale: 'es',
    })
    const images = (meta.openGraph as any)?.images
    expect(images?.[0]?.url).toBe('https://juanangulo.dev/media/raw.jpg')
  })

  // ── OG image: no explicit image → overlay applied ───────────────────────

  it('applies title overlay on heroImage cloudinaryUrl when no explicit OG image', async () => {
    const heroImage = makeMedia()
    const meta = await generateMeta({
      doc: {
        title: 'Hero Post',
        slug: 'hero-post',
        content: { heroImage },
      } as any,
      locale: 'es',
    })
    expect(mockGetCloudinaryOgWithTitle).toHaveBeenCalledWith(cloudinaryUrl, 'Hero Post')
    const images = (meta.openGraph as any)?.images
    expect(images?.[0]?.url).toBe(`${cloudinaryUrl}?og=1`)
  })

  it('uses heroImage.url when cloudinaryUrl is absent but url is a Cloudinary URL', async () => {
    const cldUrl = 'https://res.cloudinary.com/dmufha3qv/image/upload/v1/portfolio/alt.jpg'
    const heroImage = makeMedia({ cloudinaryUrl: undefined, url: cldUrl })
    const meta = await generateMeta({
      doc: { title: 'Post', slug: 'p', content: { heroImage } } as any,
      locale: 'es',
    })
    expect(mockGetCloudinaryOgWithTitle).toHaveBeenCalledWith(cldUrl, 'Post')
  })

  it('falls back to getFallbackBySlug when heroImage has no Cloudinary URL', async () => {
    const heroImage = makeMedia({ cloudinaryUrl: undefined, url: '/media/local.jpg' })
    const meta = await generateMeta({
      doc: { title: 'Post', slug: 'local-post', content: { heroImage } } as any,
      locale: 'es',
    })
    expect(getFallbackBySlug).toHaveBeenCalledWith('local-post')
    expect(mockGetCloudinaryOgWithTitle).toHaveBeenCalled()
    const callUrl = mockGetCloudinaryOgWithTitle.mock.calls[0][0] as string
    expect(callUrl).toContain('fallback-local-post')
  })

  it('falls back to getFallbackBySlug when heroImage is unpopulated (string ID)', async () => {
    const meta = await generateMeta({
      doc: {
        title: 'Post',
        slug: 'id-post',
        content: { heroImage: 'media-id-string' },
      } as any,
      locale: 'es',
    })
    expect(getFallbackBySlug).toHaveBeenCalledWith('id-post')
    expect(mockGetCloudinaryOgWithTitle).toHaveBeenCalled()
  })

  it('falls back to getFallbackBySlug when doc has no content at all', async () => {
    const meta = await generateMeta({
      doc: { title: 'Page', slug: 'about' } as any,
      locale: 'es',
    })
    expect(getFallbackBySlug).toHaveBeenCalledWith('about')
    expect(mockGetCloudinaryOgWithTitle).toHaveBeenCalled()
  })

  it('uses customPath slug for fallback when doc.slug is absent', async () => {
    await generateMeta({
      doc: { title: 'Page' } as any,
      locale: 'es',
      path: '/works/project-x',
    })
    expect(getFallbackBySlug).toHaveBeenCalledWith('works/project-x')
  })

  it('passes the resolved title to getCloudinaryOgWithTitle', async () => {
    await generateMeta({
      doc: { title: 'My Title', slug: 'slug', content: {} } as any,
      locale: 'es',
    })
    const callTitle = mockGetCloudinaryOgWithTitle.mock.calls[0][1] as string
    expect(callTitle).toBe('My Title')
  })

  // ── doc: null ───────────────────────────────────────────────────────────

  it('handles null doc gracefully (no crash)', async () => {
    const meta = await generateMeta({ doc: null, locale: 'es' })
    expect(meta.title).toBe('Juan Carlos Angulo')
    // Should still produce a valid OG image via fallback
    expect(mockGetCloudinaryOgWithTitle).toHaveBeenCalled()
  })
})
