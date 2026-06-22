import type { Schema } from './types'

export interface WebPageSchemaInput {
  /** WebPage or a subtype such as ContactPage / AboutPage. */
  type?: string
  name: string
  url: string
  description?: string
}

/**
 * Minimal WebPage (or subtype) node linked to the site #website and
 * #organization. Used to give standalone static pages (contact/privacy/terms)
 * a basic structured-data identity. SEO audit jun-2026, issue #48.
 */
export function generateWebPageSchema(input: WebPageSchemaInput): Schema {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || ''
  const url = input.url.startsWith('http') ? input.url : `${baseUrl}${input.url}`

  const schema: Schema = {
    '@context': 'https://schema.org',
    '@type': input.type || 'WebPage',
    '@id': url,
    name: input.name,
    url,
    isPartOf: { '@id': `${baseUrl}/#website` },
    publisher: { '@id': `${baseUrl}/#organization` },
  }

  if (input.description) {
    schema.description = input.description
  }

  return schema
}
