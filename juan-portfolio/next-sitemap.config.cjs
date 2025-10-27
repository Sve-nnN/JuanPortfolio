const SITE_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  'https://example.com'

// Remove trailing slash if present
const normalizedUrl = SITE_URL.replace(/\/$/, '')

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: normalizedUrl,
  generateRobotsTxt: true,
  // Do not exclude site sections like /case-studies or /authors so they are discoverable
  exclude: ['/admin/*', '/api/*', '/next-sitemap.xml', '/server-sitemap.xml'],
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
      `${normalizedUrl}/case-studies-sitemap.xml`,
      `${normalizedUrl}/authors-sitemap.xml`,
    ],
  },
}
