import type { MetadataRoute } from 'next'
import { getServerSideURL } from '@/utilities/getURL'

export default function robots(): MetadataRoute.Robots {
  const url: string = getServerSideURL()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin',
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
