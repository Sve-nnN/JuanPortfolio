/**
 * @file Canonical blog-post URL helpers.
 *
 * A post can be reached under any `/blog/[category]/[slug]` combination, but it
 * has exactly ONE canonical category: its first assigned category (falling back
 * to `general`). Canonical URLs, hreflang, sitemap entries, ISR revalidation and
 * CWV scans must all agree on that single category so the same content is not
 * indexed (or measured, or revalidated) under multiple URLs.
 *
 * Milestone v1.6 — issues #85 (duplicates/hreflang), #96/#97 (revalidate/CWV).
 */
import type { Payload } from 'payload'
import type { Post } from '@/payload-types'

const MONGO_ID_RE = /^[0-9a-f]{24}$/i

/** A raw Mongo ObjectID is never a valid category slug → coerce to `general`. */
const sanitize = (slug: string): string => (MONGO_ID_RE.test(slug) ? 'general' : slug)

/**
 * Canonical category slug from a post whose `categories` are already populated
 * (depth ≥ 1), e.g. in page components and `generateMetadata`/`generateStaticParams`.
 */
export const getCanonicalCategorySlug = (post: Partial<Post> | null | undefined): string => {
  const categories = post?.categories
  if (Array.isArray(categories) && categories.length > 0) {
    const first = categories[0]
    if (first && typeof first === 'object' && 'slug' in first && first.slug) {
      return sanitize(first.slug)
    }
    if (typeof first === 'string') return sanitize(first)
  }
  return 'general'
}

/**
 * Canonical category slug when `categories` may be unpopulated IDs (Payload
 * hooks run at depth 0). Resolves the category via Payload when needed.
 */
export const resolveCanonicalCategorySlug = async (
  payload: Payload,
  post: Partial<Post> | null | undefined,
): Promise<string> => {
  const first = post?.categories?.[0]
  if (!first) return 'general'
  if (typeof first === 'object' && 'slug' in first && first.slug) return sanitize(first.slug)
  if (typeof first === 'string') {
    try {
      const cat = await payload.findByID({ collection: 'categories', id: first, depth: 0 })
      return cat?.slug ? sanitize(cat.slug) : 'general'
    } catch {
      return 'general'
    }
  }
  return 'general'
}

/** Locale prefix: `es` has no prefix, `en` lives under `/en`. */
export const localePrefix = (locale: 'en' | 'es'): string => (locale === 'es' ? '' : '/en')

/** Canonical, locale-prefixed blog path for a post: `/blog/{category}/{slug}` (populated post). */
export const getCanonicalPostPath = (post: Partial<Post>, locale: 'en' | 'es' = 'es'): string =>
  `${localePrefix(locale)}/blog/${getCanonicalCategorySlug(post)}/${post.slug}`
