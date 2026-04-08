import type { OrganizationSchemaInput, Schema } from './types'

export function generateOrganizationSchema(input: OrganizationSchemaInput): Schema {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || ''
  
  const logo = input.logo
    ? input.logo.startsWith('http')
      ? input.logo
      : `${baseUrl}${input.logo}`
    : undefined

  const validSameAs = (input.sameAs || []).filter(url => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  })

  const schema: Schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: input.name,
    url: input.url,
    founder: {
      '@id': `${baseUrl}/#person`,
    },
  }

  if (logo) {
    schema.logo = logo
  }

  if (input.description) {
    schema.description = input.description
  }

  if (validSameAs.length > 0) {
    schema.sameAs = validSameAs
  }

  if (input.contactPoint) {
    schema.contactPoint = {
      '@type': 'ContactPoint',
      contactType: input.contactPoint.contactType,
      ...(input.contactPoint.email && { email: input.contactPoint.email }),
      ...(input.contactPoint.telephone && { telephone: input.contactPoint.telephone }),
    }
  }

  return schema
}
