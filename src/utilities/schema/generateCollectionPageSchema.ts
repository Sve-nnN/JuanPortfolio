import type { CollectionPageSchemaInput, Schema } from './types'

export function generateCollectionPageSchema(input: CollectionPageSchemaInput): Schema {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || ''
  
  const url = input.url.startsWith('http') ? input.url : `${baseUrl}${input.url}`

  const schema: Schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    url,
  }

  if (typeof input.numberOfItems === 'number') {
    schema.numberOfItems = input.numberOfItems
  }

  if (input.description) {
    schema.description = input.description
  }

  return schema
}
