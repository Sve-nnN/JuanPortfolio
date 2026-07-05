import type { CollectionAfterReadHook } from 'payload'

type MinimalAuthorDoc = { id: string; name?: string | null; slug?: string | null }

// Populates the readonly `populatedAuthors` mirror consumed by PostHero and
// generateSchema. Phase 56: prefer the new `postAuthors` (Authors collection);
// fall back to the legacy `authors` (users) when postAuthors is empty. Both emit
// the identical `{ id, name, slug }` shape so downstream renders are unchanged.
// (The `users` collection is read-locked, which is the original reason this
// mirror exists; `authors` is public but we keep the same mirror for parity.)
export const populateAuthors: CollectionAfterReadHook = async ({
  doc,
  req: _req,
  req: { payload },
}) => {
  // Prefer postAuthors → 'authors'; fall back to authors → 'users'. Phase 56.
  const usePostAuthors = Array.isArray(doc?.postAuthors) && doc.postAuthors.length > 0
  const source = usePostAuthors ? doc.postAuthors : doc?.authors
  const sourceCollection: 'authors' | 'users' = usePostAuthors ? 'authors' : 'users'

  if (Array.isArray(source) && source.length > 0) {
    const authorDocs: MinimalAuthorDoc[] = []

    for (const author of source) {
      try {
        const authorDoc = (await payload.findByID({
          id: typeof author === 'object' ? author?.id : author,
          collection: sourceCollection,
          depth: 0,
        })) as unknown as MinimalAuthorDoc

        if (authorDoc) {
          authorDocs.push(authorDoc)
        }

        if (authorDocs.length > 0) {
          doc.populatedAuthors = authorDocs.map((authorDoc) => {
            const maybe = authorDoc as unknown as { slug?: string; name?: string }
            const slugify = (s: string) =>
              String(s || '')
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')

            return {
              id: authorDoc.id,
              name: authorDoc.name,
              // include slug if available, otherwise generate from name
              slug: maybe.slug || (maybe.name ? slugify(maybe.name) : undefined),
            }
          })
        }
      } catch {
        // swallow error
      }
    }
  }

  return doc
}
