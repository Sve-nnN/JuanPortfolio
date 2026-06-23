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

  if (input.email) {
    schema.email = input.email.startsWith('mailto:')
      ? input.email
      : `mailto:${input.email}`
  }

  // NAP / GEO entity signal — the person's home base. Strengthens entity
  // disambiguation for AI search and local relevance. SEO audit jun-2026, #47.
  if (input.address && (input.address.addressLocality || input.address.addressCountry)) {
    schema.address = {
      '@type': 'PostalAddress',
      ...(input.address.addressLocality && { addressLocality: input.address.addressLocality }),
      ...(input.address.addressRegion && { addressRegion: input.address.addressRegion }),
      ...(input.address.addressCountry && { addressCountry: input.address.addressCountry }),
    }
  }

  if (input.worksFor) {
    schema.worksFor = {
      '@type': 'Organization',
      name: input.worksFor.name,
      ...(input.worksFor.id && { '@id': input.worksFor.id }),
    }
  }

  if (validSameAs.length > 0) {
    schema.sameAs = validSameAs
  }

  if (input.knowsAbout && input.knowsAbout.length > 0) {
    schema.knowsAbout = input.knowsAbout
  }

  if (input.alumniOf && input.alumniOf.length > 0) {
    schema.alumniOf = input.alumniOf.map(edu => ({
      '@type': 'EducationalOrganization',
      name: edu.name,
      ...(edu.url && { url: edu.url }),
    }))
  }

  // Combine explicit credentials with any degrees declared on alumniOf entries,
  // which were previously silently dropped. SEO audit jun-2026, issue #50.
  const credentials = [
    ...(input.hasCredential || []).map(cred => ({
      '@type': 'EducationalOccupationalCredential',
      name: cred.name,
      recognizedBy: {
        '@type': 'Organization',
        name: cred.organization,
      },
      ...(cred.datePublished && { datePublished: cred.datePublished }),
    })),
    ...(input.alumniOf || [])
      .filter(edu => edu.degree)
      .map(edu => ({
        '@type': 'EducationalOccupationalCredential',
        name: edu.degree as string,
        credentialCategory: 'degree',
        recognizedBy: {
          '@type': 'EducationalOrganization',
          name: edu.name,
        },
      })),
  ]

  if (credentials.length > 0) {
    schema.hasCredential = credentials
  }

  return schema
}
