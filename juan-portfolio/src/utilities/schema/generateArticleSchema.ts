import type { ArticleSchemaInput, Schema } from './types'

export function generateArticleSchema(input: ArticleSchemaInput): Schema {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || ''

  const image = input.image
    ? input.image.startsWith('http')
      ? input.image
      : `${baseUrl}${input.image}`
    : undefined

  const authors = input.author && input.author.length > 0
    ? input.author.map(author => ({
        '@type': 'Person',
        '@id': `${baseUrl}/#person`,
        name: author.name,
        ...(author.url && { url: author.url }),
        ...(author.image && {
          image: author.image.startsWith('http')
            ? author.image
            : `${baseUrl}${author.image}`,
        }),
      }))
    : [
        {
          '@type': 'Person',
          '@id': `${baseUrl}/#person`,
          name: 'Juan Carlos Angulo',
          url: `${baseUrl}/authors/juan-carlos-angulo`,
        },
      ]

  const schema: Schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.headline,
    datePublished: input.datePublished,
    dateModified: input.dateModified || input.datePublished,
    author: authors.length === 1 ? authors[0] : authors,
    publisher: {
      '@id': `${baseUrl}/#organization`,
    },
  }

  if (input.description) {
    schema.description = input.description
  }

  if (image) {
    schema.image = image
  }

  if (input.categories && input.categories.length > 0) {
    schema.articleSection = input.categories
  }

  return schema
}
