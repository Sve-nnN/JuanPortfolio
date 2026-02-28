import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'
import { getCloudinaryOgWithTitle } from './cloudinaryUrl'
import { getFallbackBySlug } from '@/constants/fallbackImages'

type DocWithContent = { content?: { heroImage?: (string | null) | Media } }

/**
 * Returns the URL for an explicit OG image (meta.og.image).
 * Prefers the Cloudinary URL stored on the media document.
 * Returns null when no image is set.
 */
const getExplicitOgImageURL = (
  image: Media | Config['db']['defaultIDType'] | null | undefined,
): string | null => {
  if (!image || typeof image !== 'object' || !('url' in image)) return null
  const media = image as Media
  const serverUrl = getServerSideURL().replace(/\/$/, '')

  // Prefer full Cloudinary URL stored on the media document
  if (media.cloudinaryUrl) return media.cloudinaryUrl

  // Fall back to Payload's OG-size URL, then the original URL
  const raw = media.sizes?.og?.url ?? media.url
  if (!raw) return null
  return raw.startsWith('http') ? raw : serverUrl + raw
}

/**
 * Extracts a Cloudinary URL from a populated Media object (hero image).
 * Returns null when the image is unpopulated (ID string) or not on Cloudinary.
 */
const getHeroCloudinaryUrl = (
  heroImage: (string | null) | Media | undefined,
): string | null => {
  if (!heroImage || typeof heroImage !== 'object') return null
  const media = heroImage as Media
  if (media.cloudinaryUrl?.includes('cloudinary.com')) return media.cloudinaryUrl
  if (media.url?.includes('cloudinary.com')) return media.url
  return null
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
  locale?: 'en' | 'es' | 'all' | undefined
  path?: string // Optional path to override auto-slug calculation
}): Promise<Metadata> => {
  const { doc, locale, path: customPath } = args

  // When fields are localized, Payload may store meta as an object per-locale.
  const meta = (() => {
    if (!doc) return undefined
    // @ts-expect-error - Property meta_group does not exist on type Partial<Page> | Partial<Post>
    const m = doc.meta || doc.meta_group
    if (!m) return undefined
    if (typeof m === 'object' && ('en' in m || 'es' in m)) {
      const key = locale || 'en'
      return m[key] || m['en']
    }
    return m
  })()

  const title = meta?.title || doc?.title || 'Juan Carlos Angulo'

  // --- OG image resolution ---
  // When the editor has set an explicit OG image, use it as-is.
  // When there is no explicit OG image, generate a Cloudinary URL with the
  // page title overlaid on the post's hero image (or a slug-based fallback).
  const explicitOgUrl = getExplicitOgImageURL(meta?.image ?? doc?.meta?.image)

  let ogImage: string
  if (explicitOgUrl) {
    ogImage = explicitOgUrl
  } else {
    const heroCloudinaryUrl = getHeroCloudinaryUrl(
      (doc as DocWithContent)?.content?.heroImage,
    )
    const slug = Array.isArray(doc?.slug)
      ? doc.slug.join('/')
      : (doc?.slug ?? customPath?.replace(/^\//, '') ?? '')
    const baseUrl = heroCloudinaryUrl ?? getFallbackBySlug(slug)
    ogImage = getCloudinaryOgWithTitle(baseUrl, title)
  }

  const baseUrl = getServerSideURL().replace(/\/$/, '')

  // Calculate relative path
  let relativePath = customPath
  if (!relativePath) {
    const slug = Array.isArray(doc?.slug) ? doc?.slug.join('/') : doc?.slug || ''
    relativePath = slug === 'home' ? '/' : `/${slug}`
  }

  // Ensure relativePath starts with /
  if (relativePath && !relativePath.startsWith('/')) {
    relativePath = `/${relativePath}`
  }

  // Normalize: remove trailing slash if not root
  const cleanPath = relativePath === '/' ? '' : relativePath.replace(/\/$/, '')

  const esUrl = cleanPath ? `${baseUrl}${cleanPath}` : `${baseUrl}/`
  const enUrl = cleanPath ? `${baseUrl}/en${cleanPath}` : `${baseUrl}/en`

  const alternates = {
    canonical: locale === 'en' ? enUrl : esUrl,
    languages: {
      'es': esUrl,
      'en': enUrl,
      'x-default': esUrl,
    },
  }

  return {
    description: meta?.description ?? doc?.meta?.description,
    title,
    alternates,
    openGraph: mergeOpenGraph({
      description: meta?.description || doc?.meta?.description || '',
      images: ogImage
        ? [
          {
            url: ogImage,
          },
        ]
        : undefined,
      title,
      url: locale === 'en' ? (cleanPath ? `/en${cleanPath}` : '/en') : (cleanPath || '/'),
    }),
  }
}
