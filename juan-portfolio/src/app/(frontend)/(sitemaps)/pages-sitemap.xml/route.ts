import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
// import config from '@payload-config'
import config from '../../../../payload.config'
import { unstable_cache } from 'next/cache'

const getPagesSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const SITE_URL =
      process.env.NEXT_PUBLIC_SERVER_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      'https://example.com'

    try {
      const results = await payload.find({
        collection: 'pages',
        overrideAccess: true,
        draft: false,
        depth: 0,
        limit: 1000,
        pagination: false,
        where: {
          _status: {
            equals: 'published',
          },
        },
        select: {
          slug: true,
          updatedAt: true,
        },
      })

      const locales = ['en', 'es']
      const dateFallback = new Date().toISOString()

      const defaultSitemap = locales.flatMap(locale => {
        const prefix = locale === 'es' ? '' : `/${locale}`
        return [
          {
            loc: `${SITE_URL}${prefix}/search`,
            lastmod: dateFallback,
          },
          {
            loc: `${SITE_URL}${prefix}/blog`,
            lastmod: dateFallback,
          },
        ]
      })

      const sitemap = results.docs
        ? results.docs
            .filter((page) => Boolean(page?.slug))
            .flatMap((page) => {
              return locales.map(locale => {
                const prefix = locale === 'es' ? '' : `/${locale}`
                return {
                  loc: page?.slug === 'home' ? `${SITE_URL}${prefix}/` : `${SITE_URL}${prefix}/${page?.slug}`,
                  lastmod: page.updatedAt || dateFallback,
                }
              })
            })
        : []

      return [...defaultSitemap, ...sitemap]
    } catch (error) {
      console.error('Error generating pages sitemap:', error)
      return []
    }
  },
  ['pages-sitemap'],
  {
    tags: ['pages-sitemap'],
  },
)

export async function GET() {
  try {
    const sitemap = await getPagesSitemap()
    return getServerSideSitemap(sitemap)
  } catch (error) {
    console.error('CRITICAL PAGES SITEMAP ERROR:', error)
    return new Response('Error generating sitemap', { status: 500 })
  }
}
