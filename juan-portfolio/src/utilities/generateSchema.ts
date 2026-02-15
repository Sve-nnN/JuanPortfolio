import type { Page, Post } from '@/payload-types'
import { generateBreadcrumbSchema } from './schema/generateBreadcrumbSchema'

type GenerateSchemaArgs = {
  doc: Partial<Page> | Partial<Post> | null
  collection: 'pages' | 'posts'
  url: string
  breadcrumbs?: Array<{ name: string; url: string }>
}

export const generateSchema = ({ doc: rawDoc, collection, url, breadcrumbs }: GenerateSchemaArgs): any => {
  if (!rawDoc) return null
  const doc = rawDoc as any

  // Helper to get meta fields safely
  const meta = doc.meta || doc.meta_group
  
  const title = meta?.title || doc.title
  const description = meta?.description
  const image = meta?.image?.url || meta?.image?.sizes?.og?.url

  const baseSchema = {
    '@context': 'https://schema.org',
    url,
    name: title,
    description: description,
    image: image ? `${process.env.NEXT_PUBLIC_SERVER_URL}${image}` : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Juan Tech',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_SERVER_URL}/logo.png`
      }
    }
  }

  let mainEntity = null

  if (collection === 'posts') {
    let authorName = 'Juan Carlos Angulo'
    const authors = doc.populatedAuthors || doc.authors
    
    if (Array.isArray(authors) && authors.length > 0) {
      const firstAuthor = authors[0]
      if (typeof firstAuthor === 'object' && 'name' in firstAuthor && firstAuthor.name) {
        authorName = firstAuthor.name
      }
    }

    mainEntity = {
      ...baseSchema,
      '@type': 'Article',
      headline: title,
      datePublished: doc.publishedAt,
      dateModified: doc.updatedAt,
      author: {
        '@type': 'Person',
        name: authorName,
        url: `${process.env.NEXT_PUBLIC_SERVER_URL}`
      }
    }
  } else {
    mainEntity = {
      ...baseSchema,
      '@type': 'WebPage',
      datePublished: doc.publishedAt,
      dateModified: doc.updatedAt,
    }
  }

  if (breadcrumbs) {
    const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs)
    if (breadcrumbSchema) {
      return {
        '@context': 'https://schema.org',
        '@graph': [mainEntity, breadcrumbSchema]
      }
    }
  }

  return mainEntity
}
