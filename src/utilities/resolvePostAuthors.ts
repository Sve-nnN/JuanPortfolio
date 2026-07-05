/**
 * Phase 56 (AUTHORS-03) — centralized read-cutover-with-fallback for the authors
 * a Post exposes.
 *
 * Consumers that start from an already-fetched Post (AuthorCard, the post byline,
 * JSON-LD) call this instead of reading `post.authors[0]` directly. It prefers the
 * new `postAuthors` relationship (docs from the `authors` collection) and FALLS
 * BACK to the legacy `authors` relationship (User docs) when `postAuthors` is
 * empty/absent or only holds unresolved ids. Both branches normalize to the same
 * `NormalizedAuthor` shape so the render is byte-identical regardless of source.
 *
 * PURE: it does not query. The caller must fetch the post with `depth >= 1` so the
 * relationship is resolved to objects (current callers use depth 1–2). Until Juan
 * runs `migrate:authors`, `postAuthors` is empty on every post and this resolves
 * exactly like today via the fallback — so a single deploy is safe either way.
 */

export type NormalizedAuthor = {
  id: string
  name?: string | null
  slug?: string | null
  jobTitle?: string | null
  bio?: string | null
  /** Resolved media object (or id) passed through untouched, consumed as today. */
  avatar?: unknown
  socialMedia?: {
    linkedin?: string | null
    github?: string | null
    twitter?: string | null
    website?: string | null
  } | null
  expertise?: Array<{ topic?: string | null }> | null
  education?: unknown[] | null
  experience?: unknown[] | null
  role?: string | null
}

/**
 * Loose input shape: accepts either User docs (legacy `authors`) or Author docs
 * (`postAuthors`) without forcing a single collection's generated type.
 */
type PostWithAuthors = {
  postAuthors?: unknown[] | null
  authors?: unknown[] | null
}

/** True when the relationship entry is a resolved doc object, not a bare id. */
const isResolvedDoc = (entry: unknown): entry is Record<string, unknown> =>
  typeof entry === 'object' && entry !== null

const normalize = (doc: Record<string, unknown>): NormalizedAuthor => ({
  id: String(doc.id ?? ''),
  name: (doc.name as string | null | undefined) ?? null,
  slug: (doc.slug as string | null | undefined) ?? null,
  jobTitle: (doc.jobTitle as string | null | undefined) ?? null,
  bio: (doc.bio as string | null | undefined) ?? null,
  avatar: doc.avatar,
  socialMedia: (doc.socialMedia as NormalizedAuthor['socialMedia']) ?? null,
  expertise: (doc.expertise as NormalizedAuthor['expertise']) ?? null,
  education: (doc.education as unknown[] | null | undefined) ?? null,
  experience: (doc.experience as unknown[] | null | undefined) ?? null,
  role: (doc.role as string | null | undefined) ?? null,
})

export function resolvePostAuthors(post: PostWithAuthors | null | undefined): NormalizedAuthor[] {
  if (!post) return []

  // Prefer postAuthors (Authors collection) only when it holds resolved objects.
  const postAuthors = Array.isArray(post.postAuthors) ? post.postAuthors : []
  const resolvedPostAuthors = postAuthors.filter(isResolvedDoc)
  if (resolvedPostAuthors.length > 0) {
    return resolvedPostAuthors.map(normalize)
  }

  // Fallback: legacy authors → users. Same normalization for identical render.
  const legacyAuthors = Array.isArray(post.authors) ? post.authors : []
  return legacyAuthors.filter(isResolvedDoc).map(normalize)
}
