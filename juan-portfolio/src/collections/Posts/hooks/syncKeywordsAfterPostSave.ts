import { CollectionAfterChangeHook } from 'payload'

export const syncKeywordsAfterPostSave: CollectionAfterChangeHook = async ({
  doc, // full document data
  previousDoc, // document data before updating
  req, // full express request
  operation, // name of the operation ie. 'create', 'update'
  collection, // collection config
}) => {
  // If no slug, we can't link keywords
  if (!doc.slug) return doc

  const { payload } = req
  const collectionSlug = collection.slug

  try {
    // 1. Find keywords that should point to this document (post or page)
    // We search for keyword-metrics where targetURL contains the document slug
    const keywordsToLink = await payload.find({
      collection: 'keyword-metrics',
      where: {
        targetURL: {
          contains: doc.slug,
        },
      },
      limit: 100,
    })

    if (keywordsToLink.docs.length > 0) {
      await Promise.all(
        keywordsToLink.docs.map((kw) => {
          const updateData: any = {}
          
          if (collectionSlug === 'posts') {
            updateData.post = doc.id
          } else if (collectionSlug === 'pages') {
            updateData.page = doc.id
          }

          if (Object.keys(updateData).length === 0) return Promise.resolve()

          return payload.update({
            collection: 'keyword-metrics',
            id: kw.id,
            data: updateData,
          })
        })
      )
      payload.logger.info(`Synced ${keywordsToLink.docs.length} keywords for ${collectionSlug}: ${doc.slug}`)
    }
  } catch (error) {
    payload.logger.error(`Error syncing keywords for ${collectionSlug} ${doc.slug}: ${error}`)
  }

  return doc
}
