import type { PersonSchemaInput, Schema } from './types'

export function generatePersonSchema(input: PersonSchemaInput): Schema {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || ''

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
    '@type': 'Person',
    '@id': `${baseUrl}/#person`,
    name: input.name,
    url: input.url,
  }

  if (input.jobTitle) {
    schema.jobTitle = input.jobTitle
  }

  if (input.description) {
    schema.description = input.description
  }

  if (input.image) {
    schema.image = input.image.startsWith('http')
      ? input.image
      : `${baseUrl}${input.image}`
  }

  if (validSameAs.length > 0) {
    schema.sameAs = validSameAs
  }

  if (input.knowsAbout && input.knowsAbout.length > 0) {
    schema.knowsAbout = input.knowsAbout
  }

  if (input.alumniOf && input.alumniOf.length > 0) {
    schema.alumniOf = input.alumniOf.map(edu => ({
      '@type': 'Organization',
      name: edu.name,
      ...(edu.url && { url: edu.url }),
    }))
  }

  if (input.hasCredential && input.hasCredential.length > 0) {
    schema.hasCredential = input.hasCredential.map(cred => ({
      '@type': 'EducationalOccupationalCredential',
      name: cred.name,
      recognizedBy: {
        '@type': 'Organization',
        name: cred.organization,
      },
      ...(cred.datePublished && { datePublished: cred.datePublished }),
    }))
  }

  return schema
}
