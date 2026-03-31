import type { Page, Post } from '@/payload-types'
import { generateBreadcrumbSchema } from './schema/generateBreadcrumbSchema'
import type { Schema } from './schema/types'

type GenerateSchemaArgs = {
  doc: Partial<Page> | Partial<Post> | null
  collection: 'pages' | 'posts'
  url: string
  breadcrumbs?: Array<{ name: string; url: string }>
}

export const generateSchema = ({ doc: rawDoc, collection, url, breadcrumbs }: GenerateSchemaArgs): Schema | null => {
  if (!rawDoc) return null
  const doc = rawDoc as unknown as Post & Page

  // Helper to get meta fields safely (meta_group is a legacy field name)
  const meta = doc.meta ?? (rawDoc as { meta_group?: Post['meta'] })?.meta_group
  
  const title = meta?.title || doc.title
  const description = meta?.description
  const metaImage = meta?.image && typeof meta.image === 'object' ? meta.image : undefined
  const image = metaImage?.url || metaImage?.sizes?.og?.url

  const baseSchema: Schema = {
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

  let mainEntity: Schema | null = null

  if (collection === 'posts') {
    const authors = doc.populatedAuthors || doc.authors
    const authorId = `${process.env.NEXT_PUBLIC_SERVER_URL}/#person`
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
      '@id': url,
      headline: title,
      description: (doc.content as Post['content'])?.tldr || description,
      datePublished: doc.publishedAt,
      dateModified: doc.updatedAt,
      author: {
        '@type': 'Person',
        '@id': authorId,
        name: authorName,
        url: `${process.env.NEXT_PUBLIC_SERVER_URL}/author/juan-carlos-angulo`
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url,
      },
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
    if (breadcrumbSchema && mainEntity) {
      return {
        '@context': 'https://schema.org',
        '@graph': [mainEntity, breadcrumbSchema]
      }
    }
  }

  return mainEntity
}
