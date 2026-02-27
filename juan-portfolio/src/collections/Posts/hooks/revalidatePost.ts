import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Post } from '../../../payload-types'

export const revalidatePost: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    const { revalidatePath, revalidateTag } = await import('next/cache')

    if (doc._status === 'published') {
      const path = `/blog/${doc.slug}`

      revalidatePath(path)
      revalidateTag('posts-sitemap')
    }

    // If the post was previously published, we need to revalidate the old path
    if (previousDoc._status === 'published' && doc._status !== 'published') {
      const oldPath = `/blog/${previousDoc.slug}`

      revalidatePath(oldPath)
      revalidateTag('posts-sitemap')
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = async ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const { revalidatePath, revalidateTag } = await import('next/cache')
    const path = `/blog/${doc?.slug}`

    revalidatePath(path)
    revalidateTag('posts-sitemap')
  }

  return doc
}
