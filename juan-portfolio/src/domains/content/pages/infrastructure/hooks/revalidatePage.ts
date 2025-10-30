import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidate } from '../../../../../utilities/revalidate'

export const revalidatePage: CollectionAfterChangeHook = async ({ doc, req, collection }) => {
  if (doc._status === 'published') {
    revalidate({ collection: collection.slug, slug: doc.slug, req })
  }
}

export const revalidateDelete: CollectionAfterDeleteHook = async ({ doc, req, collection }) => {
  revalidate({ collection: collection.slug, slug: doc.slug, req })
}
