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

  // The `home` Page must preview at `/` (es) or `/en` (en), not `/home`, since the
  // home route lives at the locale root, not at the pages slug path.
  const path =
    collection === 'pages' && slug === 'home'
      ? localePrefix || '/'
      : `${localePrefix}${collectionPrefixMap[collection]}/${slug}`

  const encodedParams = new URLSearchParams({
    slug,
    collection,
    path,
    previewSecret: process.env.PREVIEW_SECRET || '',
  })

  const url = `${localePrefix}/next/preview?${encodedParams.toString()}`

  return url
}
