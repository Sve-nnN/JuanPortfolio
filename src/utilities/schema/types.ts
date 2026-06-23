export interface BreadcrumbItem {
  name: string
  url: string
}

export interface OrganizationSchemaInput {
  name: string
  url: string
  logo?: string
  description?: string
  sameAs?: string[]
  contactPoint?: {
    contactType: string
    email?: string
    telephone?: string
  }
}

export interface PersonSchemaInput {
  name: string
  url: string
  jobTitle?: string
  description?: string
  image?: string
  email?: string
  sameAs?: string[]
  knowsAbout?: string[]
  /** NAP / GEO entity signal: where the person is based. */
  address?: {
    addressLocality?: string
    addressRegion?: string
    addressCountry?: string
  }
  /** Organization the person works for, linked by @id to the site Organization. */
  worksFor?: {
    name: string
    id?: string
  }
  alumniOf?: {
    name: string
    url?: string
    degree?: string
  }[]
  hasCredential?: {
    name: string
    organization: string
    datePublished?: string
  }[]
}

export interface ArticleSchemaInput {
  headline: string
  description?: string
  image?: string
  datePublished: string
  dateModified?: string
  author?: {
    name: string
    url?: string
    image?: string
  }[]
  categories?: string[]
}

export interface CollectionPageSchemaInput {
  name: string
  description?: string
  url: string
  numberOfItems?: number
}

export interface FAQItem {
  question: string
  answer: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Schema = Record<string, any>
