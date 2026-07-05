import type { Page } from 'src/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

async function getPageBySlug(slug: string, depth = 2, locale?: 'en' | 'es'): Promise<Page | null> {
  const payload = await getPayload({ config: configPromise })

  const res = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    depth,
    locale,
    limit: 1,
    pagination: false,
    // Intentional: only published docs are returned (respects authenticatedOrPublished
    // read access) so the public /blog NEVER shows drafts. Live preview / draft rendering
    // flows through the draftMode()-gated branch in the route, not this cached path.
    overrideAccess: false,
  })

  return res.docs?.[0] ?? null
}

/**
 * Returns an unstable_cache function tagged `pages_<slug>` for a Pages collection entry.
 * Mirrors getCachedGlobal so an afterChange revalidateTag('pages_'+slug) invalidates it.
 * depth defaults to 2 (not 0): layout blocks reference media/posts and must be populated.
 */
export const getCachedPageBySlug = (slug: string, depth = 2, locale?: 'en' | 'es') =>
  unstable_cache(
    async () => getPageBySlug(slug, depth, locale),
    ['page', slug, String(depth), locale || 'es'],
    {
      tags: [`pages_${slug}`],
    },
  )
