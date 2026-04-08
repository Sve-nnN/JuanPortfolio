import type { Category } from '@/payload-types'

/** MongoDB ObjectIDs are 24-char hex strings — never valid as URL slugs. */
const MONGO_ID_RE = /^[0-9a-f]{24}$/i

/**
 * Genera la URL relativa de un post en el formato /blog/{category}/{slug}
 */
export function getPostUrl(post: {
  slug?: string | null
  id?: string
  categories?: Array<string | Category> | null
  meta_extras?: {
    categories?: Array<string | Category> | null
  }
}, locale: 'en' | 'es' = 'es'): string {
  const categories = post.categories || post.meta_extras?.categories
  let categorySlug = 'general'

  if (categories && categories.length > 0) {
    const firstCategory = categories[0]
    if (typeof firstCategory === 'object' && firstCategory !== null) {
      // Populated relationship — prefer slug, but never use a raw ObjectID
      const slug = firstCategory.slug
      categorySlug = slug && !MONGO_ID_RE.test(slug) ? slug : 'general'
    } else if (typeof firstCategory === 'string') {
      // Unpopulated relationship — only use it if it looks like a real slug
      categorySlug = MONGO_ID_RE.test(firstCategory) ? 'general' : firstCategory
    }
  }

  const finalSlug = post.slug || post.id || 'untitled'
  const prefix = locale === 'es' ? '' : '/en'

  return `${prefix}/blog/${categorySlug}/${finalSlug}`
}

/**
 * Genera la URL relativa de una categoría
 */
export function getCategoryUrl(category: { slug?: string | null; id?: string }, locale: 'en' | 'es' = 'es'): string {
  const prefix = locale === 'es' ? '' : '/en'
  const slug = category.slug
  const safeSlug = slug && !MONGO_ID_RE.test(slug) ? slug : 'general'
  return `${prefix}/blog/${safeSlug}`
}
