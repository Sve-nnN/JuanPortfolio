import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
// import config from '@payload-config'
import config from '../../../../payload.config'
import { unstable_cache } from 'next/cache'
import { buildPagesSitemap } from '@/utilities/sitemap'

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

      return buildPagesSitemap(SITE_URL, results.docs || [])
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
