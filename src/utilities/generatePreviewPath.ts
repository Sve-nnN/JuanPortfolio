import { PayloadRequest, CollectionSlug } from 'payload'

const collectionPrefixMap: Partial<Record<CollectionSlug, string>> = {
  posts: '/blog',
  pages: '',
  categories: '/blog',
  'case-studies': '/case-studies',
}

type Props = {
  collection: keyof typeof collectionPrefixMap
  slug: string
  req: PayloadRequest
}

export const generatePreviewPath = ({ collection, slug, req }: Props) => {
  // Allow empty strings, e.g. for the homepage
  if (slug === undefined || slug === null) {
    return null
  }

  const locale = req.locale || 'es'
  const localePrefix = locale === 'es' ? '' : `/${locale}`

  const encodedParams = new URLSearchParams({
    slug,
    collection,
    path: `${localePrefix}${collectionPrefixMap[collection]}/${slug}`,
    previewSecret: process.env.PREVIEW_SECRET || '',
  })

  const url = `${localePrefix}/next/preview?${encodedParams.toString()}`

  return url
}
