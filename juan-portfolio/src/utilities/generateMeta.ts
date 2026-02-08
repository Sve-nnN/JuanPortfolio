import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/website-template-OG.webp'

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
  locale?: 'en' | 'es' | 'all' | undefined
}): Promise<Metadata> => {
  const { doc, locale } = args

  // When fields are localized, Payload may store meta as an object per-locale.
  // Try to read localized meta first, then fallback to top-level.
  const meta = (() => {
    if (!doc) return undefined
    // @ts-expect-error - Property meta_group does not exist on type Partial<Page> | Partial<Post>
    const m = doc.meta || doc.meta_group
    if (!m) return undefined
    // If meta has keys for locales, pick the locale or default to 'en'
    if (typeof m === 'object' && ('en' in m || 'es' in m)) {
      const key = locale || 'en'
      // meta may be localized object keyed by locale
      return m[key] || m['en']
    }
    return m
  })()

  const ogImage = getImageURL(meta?.image ?? doc?.meta?.image)

  const title = meta?.title || doc?.title || 'Juan Carlos Angulo'

  return {
    description: meta?.description ?? doc?.meta?.description,
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
      url: Array.isArray(doc?.slug) ? doc?.slug.join('/') : '/',
    }),
    title,
  }
}
