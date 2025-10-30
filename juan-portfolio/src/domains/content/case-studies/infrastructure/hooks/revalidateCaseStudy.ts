import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidate } from '../../../../../utilities/revalidate'

export const revalidateCaseStudy: CollectionAfterChangeHook = async ({ doc, req, collection }) => {
  if (doc._status === 'published') {
    revalidate({ collection: collection.slug, slug: doc.slug, req })
  }
}

export const revalidateCaseStudyDelete: CollectionAfterDeleteHook = async ({ doc, req, collection }) => {
  revalidate({ collection: collection.slug, slug: doc.slug, req })
}
