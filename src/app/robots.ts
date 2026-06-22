import type { MetadataRoute } from 'next'
import { getServerSideURL } from '@/utilities/getURL'

export default function robots(): MetadataRoute.Robots {
  const url: string = getServerSideURL()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /api/* exposes the Payload REST API (posts/pages/categories as JSON),
      // which duplicates all page content and must not be crawled/indexed.
      // SEO audit jun-2026, issue #15.
      disallow: ['/admin', '/api/'],
    },
    sitemap: [
      `${url}/sitemap.xml`,
      `${url}/pages-sitemap.xml`,
      `${url}/posts-sitemap.xml`,
      `${url}/categories-sitemap.xml`,
      `${url}/authors-sitemap.xml`,
    ],
  }
}
