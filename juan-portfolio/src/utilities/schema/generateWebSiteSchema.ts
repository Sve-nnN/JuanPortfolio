import type { Schema } from './types'

export function generateWebSiteSchema(
  siteName: string,
  siteUrl: string,
  searchUrl?: string,
): Schema {
  const schema: Schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: siteName,
    url: siteUrl,
    publisher: {
      '@id': `${siteUrl}/#organization`,
    },
  }

  if (searchUrl) {
    schema.potentialAction = {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${searchUrl}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    }
  }

  return schema
}
