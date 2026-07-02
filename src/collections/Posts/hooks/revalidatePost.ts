import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Post } from '../../../payload-types'
import { resolveCanonicalCategorySlug } from '@/utilities/postUrl'

export const revalidatePost: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  req,
}) => {
  if (!req.context.disableRevalidate) {
    const { revalidatePath, revalidateTag } = await import('next/cache')

    if (doc._status === 'published') {
      // Revalidate the REAL post URL (/blog/{category}/{slug}), not /blog/{slug}
      // which only ever matched /blog/[category]. Issue #96 (BUG-01).
      const category = await resolveCanonicalCategorySlug(req.payload, doc)
      revalidatePath(`/blog/${category}/${doc.slug}`)
      revalidatePath(`/en/blog/${category}/${doc.slug}`)
      revalidateTag('posts-sitemap')
    }

    // If the post was previously published but no longer is, revalidate its old path.
    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      const category = await resolveCanonicalCategorySlug(req.payload, previousDoc)
      revalidatePath(`/blog/${category}/${previousDoc.slug}`)
      revalidatePath(`/en/blog/${category}/${previousDoc.slug}`)
      revalidateTag('posts-sitemap')
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = async ({ doc, req }) => {
  if (!req.context.disableRevalidate) {
    const { revalidatePath, revalidateTag } = await import('next/cache')
    const category = await resolveCanonicalCategorySlug(req.payload, doc)

    revalidatePath(`/blog/${category}/${doc?.slug}`)
    revalidatePath(`/en/blog/${category}/${doc?.slug}`)
    revalidateTag('posts-sitemap')
  }

  return doc
}
