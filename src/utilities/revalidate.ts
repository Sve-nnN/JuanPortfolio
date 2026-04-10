import type { CollectionSlug, PayloadRequest } from 'payload'
import { revalidatePath } from 'next/cache'

export const revalidate = async (props: {
  collection: CollectionSlug | 'globals'
  slug?: string
  req: PayloadRequest
}) => {
  const { collection, slug, req } = props

  if (collection && slug) {
    revalidatePath(`/${collection}/${slug}`)
  }

  if (collection === 'globals') {
    revalidatePath(`/`)
  }

  if (req.payload.logger) {
    req.payload.logger.info(`Revalidated ${collection} with slug ${slug}`)
  }
}
