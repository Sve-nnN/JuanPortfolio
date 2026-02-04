import type { Category } from '@/payload-types'

/**
 * Genera la URL completa de un post en el formato /blog/{category}/{slug}
 */
export function getPostUrl(post: {
  slug?: string | null
  id?: string
  categories?: Array<string | Category> | null
  // Keep meta_extras for backward compatibility if needed, but prioritize root categories
  meta_extras?: {
    categories?: Array<string | Category> | null
  }
}): string {
  const slug = post.slug || post.id || ''

  // Obtener la primera categoría (priorizando root categories)
  const categories = post.categories || post.meta_extras?.categories
  let categorySlug = 'general' // Categoría por defecto

  if (categories && categories.length > 0) {
    const firstCategory = categories[0]
    if (typeof firstCategory === 'object') {
      // Usar slug si existe, sino usar id
      categorySlug = firstCategory.slug || firstCategory.id || 'general'
    } else if (typeof firstCategory === 'string') {
      // Si es un ID, no podemos obtener el slug sin un fetch adicional, 
      // pero el usuario quiere el formato /blog/category/slug.
      // Si depth > 0, debería ser un objeto.
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
