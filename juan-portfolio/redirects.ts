import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getPostUrl } from '@/utilities/getPostUrl'
import type { Page, Post, Redirect } from '@/payload-types'

const redirects = async () => {
  const payload = await getPayload({ config: configPromise })

  const { docs: redirectDocs } = await payload.find({
    collection: 'redirects',
    limit: 0,
    pagination: false,
    depth: 1,
  })

  // Payload types are a bit loose with deep query results
  const dynamicRedirects = (redirectDocs || []).map((redirect: Redirect) => {
    const { from, to } = redirect
    let destination = '/'

    if (to?.type === 'custom' && to.url) {
      destination = to.url
    } else if (
      to?.type === 'reference' &&
      to.reference &&
      typeof to.reference.value === 'object'
    ) {
      const relationTo = to.reference.relationTo
      const value = to.reference.value

      if (relationTo === 'pages' && value) {
        const page = value as Page
        const slug = page.slug
        destination = slug === 'home' ? '/' : `/${slug}`
      } else if (relationTo === 'posts' && value) {
        const post = value as Post
        destination = getPostUrl(post)
      }
    }

    return {
      source: from,
      destination,
      permanent: true,
    }
  })

  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header',
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  return [...dynamicRedirects, internetExplorerRedirect]
}

export default redirects
