import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL().replace(/\/$/, '')

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

  const ogImage = getImageURL(meta?.image ?? doc?.meta?.image)
  const title = meta?.title || doc?.title || 'Juan Carlos Angulo'
  
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

  const esUrl = `${baseUrl}${cleanPath || '/'}`
  const enUrl = `${baseUrl}/en${cleanPath || '/'}`

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
      url: locale === 'en' ? `/en${cleanPath || '/'}` : `${cleanPath || '/'}`,
    }),
  }
}
