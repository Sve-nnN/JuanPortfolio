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
      '@id': `${process.env.NEXT_PUBLIC_SERVER_URL}/#organization`,
      '@type': 'Organization',
      name: 'Juan Tech',
      founder: {
        '@id': `${process.env.NEXT_PUBLIC_SERVER_URL}/#person`,
      },
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_SERVER_URL}/logo.png`
      }
    }
  }

  let mainEntity = null

  if (collection === 'posts') {
    const authors = doc.populatedAuthors || doc.authors
    let authorId = `${process.env.NEXT_PUBLIC_SERVER_URL}/#person`
    let authorName = 'Juan Carlos Angulo'
    
    if (Array.isArray(authors) && authors.length > 0) {
      const firstAuthor = authors[0]
      if (typeof firstAuthor === 'object' && 'name' in firstAuthor && firstAuthor.name) {
        authorName = firstAuthor.name
      }
    }

    mainEntity = {
      ...baseSchema,
      '@type': 'BlogPosting',
      headline: title,
      description: doc.tldr || description,
      datePublished: doc.publishedAt,
      dateModified: doc.updatedAt,
      author: {
        '@type': 'Person',
        '@id': authorId,
        name: authorName,
        url: `${process.env.NEXT_PUBLIC_SERVER_URL}/author/juan-carlos-angulo`
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
