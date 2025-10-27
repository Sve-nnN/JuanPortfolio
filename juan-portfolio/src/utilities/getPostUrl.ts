import type { Category } from '@/payload-types'

/**
 * Genera la URL completa de un post en el formato /blog/{category}/{slug}
 */
export function getPostUrl(post: {
  slug?: string | null
  id?: string
  meta_extras?: {
    categories?: Array<string | Category> | null
  }
}): string {
  const slug = post.slug || post.id || ''

  // Obtener la primera categoría
  const categories = post.meta_extras?.categories
  let categorySlug = 'general' // Categoría por defecto

  if (categories && categories.length > 0) {
    const firstCategory = categories[0]
    if (typeof firstCategory === 'object') {
      // Usar slug si existe, sino usar id
      categorySlug = firstCategory.slug || firstCategory.id || 'general'
    } else if (typeof firstCategory === 'string') {
      categorySlug = firstCategory
    }
  }

  return `/blog/${categorySlug}/${slug}`
}

/**
 * Genera la URL de una categoría
 */
export function getCategoryUrl(category: { slug?: string | null; id?: string }): string {
  return `/blog/${category.slug || category.id || 'general'}`
}
