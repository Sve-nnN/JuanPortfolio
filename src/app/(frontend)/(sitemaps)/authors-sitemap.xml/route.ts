import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
// import config from '@payload-config'
import config from '../../../../payload.config'
import { unstable_cache } from 'next/cache'

const getAuthorsSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const SITE_URL =
      process.env.NEXT_PUBLIC_SERVER_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      'https://example.com'

    try {
      const results = await payload.find({
        collection: 'users',
        overrideAccess: true,
        depth: 0,
        limit: 1000,
        pagination: false,
        select: {
          slug: true,
          updatedAt: true,
        },
        where: {
          slug: {
            exists: true,
          },
        },
      })

      const locales = ['en', 'es']
      const dateFallback = new Date().toISOString()

      const sitemap = results.docs
        ? results.docs
            .filter((user) => Boolean(user?.slug))
            .flatMap((user) => {
              return locales.map(locale => {
                const prefix = locale === 'es' ? '' : `/${locale}`
                return {
                  loc: `${SITE_URL}${prefix}/authors/${user?.slug}`,
                  lastmod: user.updatedAt || dateFallback,
                }
              })
            })
        : []

      return sitemap
    } catch (error) {
      console.error('Error generating authors sitemap:', error)
      return []
    }
  },
  ['authors-sitemap'],
  {
    tags: ['authors-sitemap'],
  },
)

export async function GET() {
  try {
    const sitemap = await getAuthorsSitemap()
    return getServerSideSitemap(sitemap)
  } catch (error) {
    console.error('CRITICAL AUTHORS SITEMAP ERROR:', error)
    return new Response('Error generating sitemap', { status: 500 })
  }
}
