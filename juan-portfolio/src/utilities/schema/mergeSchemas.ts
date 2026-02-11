import type { Schema } from './types'

export function mergeSchemas(
  schemas: (Schema | Record<string, unknown> | null | undefined)[],
): Schema | null {
  const validSchemas = schemas.filter((schema): schema is Schema => schema != null)

  if (validSchemas.length === 0) {
    return null
  }

  if (validSchemas.length === 1) {
    return validSchemas[0]
  }

  return {
    '@context': 'https://schema.org',
    '@graph': validSchemas,
  }
}
