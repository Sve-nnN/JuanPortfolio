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
    // SearchAction urlTemplate must be an absolute URL. siteSettings.searchUrl
    // is typically a relative path ('/search'); resolve it against the site
    // origin so the emitted template is absolute. SEO audit jun-2026, issue #26.
    const absoluteSearchUrl = /^https?:\/\//.test(searchUrl)
      ? searchUrl
      : `${siteUrl.replace(/\/$/, '')}${searchUrl.startsWith('/') ? '' : '/'}${searchUrl}`

    schema.potentialAction = {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${absoluteSearchUrl}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    }
  }

  return schema
}
