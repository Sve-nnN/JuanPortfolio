import type { CollectionAfterReadHook } from 'payload'

export const populateAuthors: CollectionAfterReadHook = async ({ doc, req }) => {
  if (doc.authors && doc.authors.length > 0) {
    const populatedAuthors = await Promise.all(
              doc.authors.map(async (author: string | { id: string; name: string }) => {        if (typeof author === 'string') {
          const authorDoc = await req.payload.findByID({
            collection: 'users',
            id: author,
            depth: 0,
          })
          return {
            id: authorDoc.id,
            name: authorDoc.name,
          }
        }
        return {
          id: author.id,
          name: author.name,
        }
      }),
    )
    doc.populatedAuthors = populatedAuthors
  }
  return doc
}
