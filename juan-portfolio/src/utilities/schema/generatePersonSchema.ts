import type { Person, WithContext } from 'schema-dts'

export interface PersonSchemaInput {
  name: string
  jobTitle?: string
  description?: string
  image?: string
  email?: string
  url?: string
  sameAs?: string[] // Social media profiles
  knowsAbout?: string[] // Areas of expertise
  alumniOf?: Array<{
    name: string // Institution name
    degree?: string // Degree or certification name
  }> // Education credentials
}

/**
 * Generate Person schema for author markup (E-E-A-T signals)
 * 
 * @see https://schema.org/Person
 * @see https://developers.google.com/search/docs/appearance/structured-data/author
 */
export function generatePersonSchema(input: PersonSchemaInput): WithContext<Person> {
  const {
    name,
    jobTitle,
    description,
    image,
    email,
    url,
    sameAs = [],
    knowsAbout = [],
    alumniOf = [],
  } = input

  const schema: WithContext<Person> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
  }

  // Optional fields
  if (jobTitle) schema.jobTitle = jobTitle
  if (description) schema.description = description
  if (image) schema.image = image
  if (email) schema.email = email
  if (url) schema.url = url
  
  // E-E-A-T signals
  if (sameAs.length > 0) schema.sameAs = sameAs
  if (knowsAbout.length > 0) schema.knowsAbout = knowsAbout
  
  // Education credentials
  if (alumniOf.length > 0) {
    schema.alumniOf = alumniOf.map(edu => {
      const org: any = {
        '@type': 'Organization',
        name: edu.name,
      }
      if (edu.degree) {
        org.hasCredential = {
          '@type': 'EducationalOccupationalCredential',
          credentialCategory: edu.degree,
        }
      }
      return org
    })
  }

  return schema
}
