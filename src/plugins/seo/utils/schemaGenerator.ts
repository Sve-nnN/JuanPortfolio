/**
 * JSON-LD Schema Generator
 * Automatically generates appropriate structured data for SEO
 */

interface SchemaGeneratorInput {
  type?: string
  title: string
  description?: string
  url: string
  image?: string
  datePublished?: string
  dateModified?: string
  author?: {
    name: string
    url?: string
  }
  organization?: {
    name: string
    logo?: string
    url: string
  }
  breadcrumbs?: Array<{
    name: string
    url: string
  }>
  customSchema?: string
}

export function generateSchema(input: SchemaGeneratorInput): string {
  const schemas: unknown[] = []

  // Always include Organization schema
  if (input.organization) {
    schemas.push({
      '@type': 'Organization',
      '@id': `${input.organization.url}#organization`,
      name: input.organization.name,
      url: input.organization.url,
      ...(input.organization.logo && {
        logo: {
          '@type': 'ImageObject',
          url: input.organization.logo,
        },
      }),
    })
  }

  // Add appropriate schema based on type
  switch (input.type) {
    case 'Article':
    case 'BlogPosting':
    case 'NewsArticle':
      schemas.push(generateArticleSchema(input))
      break

    case 'Person':
      schemas.push(generatePersonSchema(input))
      break

    case 'Product':
      schemas.push(generateProductSchema(input))
      break

    case 'Event':
      schemas.push(generateEventSchema(input))
      break

    case 'WebPage':
    default:
      schemas.push(generateWebPageSchema(input))
      break
  }

  // Add BreadcrumbList if breadcrumbs are provided
  if (input.breadcrumbs && input.breadcrumbs.length > 0) {
    schemas.push(generateBreadcrumbSchema(input.breadcrumbs))
  }

  // Merge with custom schema if provided
  if (input.customSchema) {
    try {
      const customData = JSON.parse(input.customSchema)
      if (Array.isArray(customData)) {
        schemas.push(...customData)
      } else {
        schemas.push(customData)
      }
    } catch (error) {
      console.error('Error parsing custom schema:', error)
    }
  }

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': schemas,
  }

  return JSON.stringify(schemaData, null, 2)
}

function generateWebPageSchema(input: SchemaGeneratorInput) {
  return {
    '@type': 'WebPage',
    '@id': `${input.url}#webpage`,
    url: input.url,
    name: input.title,
    ...(input.description && { description: input.description }),
    ...(input.image && { image: input.image }),
    ...(input.datePublished && { datePublished: input.datePublished }),
    ...(input.dateModified && { dateModified: input.dateModified }),
    ...(input.organization && {
      publisher: {
        '@id': `${input.organization.url}#organization`,
      },
    }),
  }
}

function generateArticleSchema(input: SchemaGeneratorInput) {
  return {
    '@type': input.type || 'Article',
    '@id': `${input.url}#article`,
    headline: input.title,
    ...(input.description && { description: input.description }),
    url: input.url,
    ...(input.image && {
      image: {
        '@type': 'ImageObject',
        url: input.image,
      },
    }),
    ...(input.datePublished && { datePublished: input.datePublished }),
    ...(input.dateModified && { dateModified: input.dateModified }),
    ...(input.author && {
      author: {
        '@type': 'Person',
        name: input.author.name,
        ...(input.author.url && { url: input.author.url }),
      },
    }),
    ...(input.organization && {
      publisher: {
        '@id': `${input.organization.url}#organization`,
      },
    }),
  }
}

function generatePersonSchema(input: SchemaGeneratorInput) {
  return {
    '@type': 'Person',
    '@id': `${input.url}#person`,
    name: input.title,
    ...(input.description && { description: input.description }),
    url: input.url,
    ...(input.image && { image: input.image }),
  }
}

function generateProductSchema(input: SchemaGeneratorInput) {
  return {
    '@type': 'Product',
    '@id': `${input.url}#product`,
    name: input.title,
    ...(input.description && { description: input.description }),
    url: input.url,
    ...(input.image && {
      image: {
        '@type': 'ImageObject',
        url: input.image,
      },
    }),
  }
}

function generateEventSchema(input: SchemaGeneratorInput) {
  return {
    '@type': 'Event',
    '@id': `${input.url}#event`,
    name: input.title,
    ...(input.description && { description: input.description }),
    url: input.url,
    ...(input.image && {
      image: {
        '@type': 'ImageObject',
        url: input.image,
      },
    }),
    ...(input.datePublished && { startDate: input.datePublished }),
  }
}

function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  }
}

/**
 * Generate schema for a page/post
 */
export async function generateSchemaForDocument(
  doc: {
    title: string
    slug: string
    meta?: {
      description?: string
      schema?: {
        type?: string
        customSchema?: string
        autoGenerate?: boolean
      }
    }
    publishedAt?: string
    updatedAt?: string
    hero?: {
      image?: string | { url: string }
    }
    populatedAuthors?: Array<{
      name: string
      slug: string
    }>
  },
  siteConfig: {
    url: string
    name: string
    logo?: string
  },
  collectionSlug?: string,
): Promise<string> {
  // Don't generate if auto-generate is disabled
  if (doc.meta?.schema?.autoGenerate === false) {
    return doc.meta?.schema?.customSchema || ''
  }

  // Determine schema type
  let schemaType = doc.meta?.schema?.type || 'WebPage'
  if (collectionSlug === 'posts' || collectionSlug === 'case-studies') {
    schemaType = 'Article'
  }

  // Extract image URL
  let imageUrl = ''
  if (doc.hero?.image) {
    if (typeof doc.hero.image === 'string') {
      imageUrl = doc.hero.image
    } else if (doc.hero.image.url) {
      imageUrl = `${siteConfig.url}${doc.hero.image.url}`
    }
  }

  // Build URL
  const docUrl = `${siteConfig.url}/${collectionSlug}/${doc.slug}`

  // Build author
  const author = doc.populatedAuthors?.[0]
    ? {
        name: doc.populatedAuthors[0].name,
        url: `${siteConfig.url}/authors/${doc.populatedAuthors[0].slug}`,
      }
    : undefined

  return generateSchema({
    type: schemaType,
    title: doc.title,
    description: doc.meta?.description,
    url: docUrl,
    image: imageUrl,
    datePublished: doc.publishedAt,
    dateModified: doc.updatedAt,
    author,
    organization: {
      name: siteConfig.name,
      url: siteConfig.url,
      logo: siteConfig.logo,
    },
    customSchema: doc.meta?.schema?.customSchema,
  })
}
