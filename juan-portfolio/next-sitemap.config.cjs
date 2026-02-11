const SITE_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  'https://example.com'

// Remove trailing slash if present
const normalizedUrl = SITE_URL.replace(/\/$/, '')

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: normalizedUrl,
  generateRobotsTxt: false,
  // Do not exclude site sections like /case-studies or /authors so they are discoverable
  // But exclude static pages that act duplicates of pages-sitemap.xml
  exclude: [
    '/admin/*',
    '/api/*',
    '/next-sitemap.xml',
    '/server-sitemap.xml',
    '/search',
    '/blog',
    '/robots.txt',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        disallow: '/admin/*',
      },
    ],
    additionalSitemaps: [
      `${normalizedUrl}/pages-sitemap.xml`,
      `${normalizedUrl}/posts-sitemap.xml`,
      `${normalizedUrl}/categories-sitemap.xml`,
      `${normalizedUrl}/authors-sitemap.xml`,
    ],
  },
}
