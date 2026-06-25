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

  // `numberOfItems` is not valid directly on CollectionPage (Ahrefs flags it as
  // a schema.org error). Carry the count on a nested ItemList, where it IS
  // valid, via mainEntity. SCHEMA-01.
  if (typeof input.numberOfItems === 'number') {
    schema.mainEntity = {
      '@type': 'ItemList',
      numberOfItems: input.numberOfItems,
    }
  }

  if (input.description) {
    schema.description = input.description
  }

  return schema
}
