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
  numberOfItems: number
}

export interface FAQItem {
  question: string
  answer: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Schema = Record<string, any>
