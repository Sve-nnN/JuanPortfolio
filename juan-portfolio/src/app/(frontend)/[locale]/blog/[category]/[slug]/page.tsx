/**
 * @file Defines the page for a single blog post.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound, redirect } from 'next/navigation'
import { draftMode } from 'next/headers'
import { PostHero } from '@/heros/PostHero'
import { estimateReadingTimeFromLexical } from '@/utilities/estimateReadingTime'
import { extractHeadingsFromLexical } from '@/utilities/extractHeadings'
import { TableOfContents } from '@/components/TableOfContents'
import { getFallbackColorBySlug } from '@/constants/fallbackImages'
import RichText from '@/components/RichText'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import { Metadata } from 'next'
import { AuthorCard } from '@/components/AuthorCard'
import RelatedPostsServer from '@/components/RelatedPostsServer'
import { DynamicBackground } from '@/components/DynamicBackground'
import { generateMeta } from '@/utilities/generateMeta'
import { JsonLd } from '@/components/JsonLd'
import { generateSchema } from '@/utilities/generateSchema'
import { getServerSideURL } from '@/utilities/getURL'
import type { Media as MediaType } from '@/payload-types'

/**
 * Generates static parameters for all blog posts across all locales.
 * @returns {Promise<Array<{ category: string; slug: string; locale: string }>>} A promise that resolves to an array of parameters.
 */
export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'posts',
    limit: 1000,
    depth: 2, // Necesitamos depth para obtener las categorías
  })

  const locales = ['en', 'es']
  const params: Array<{ category: string; slug: string; locale: string }> = []

  for (const post of posts.docs) {
    const categories = post.categories
    let categorySlug = 'general'

    if (categories && categories.length > 0) {
      const firstCategory = categories[0]
      if (typeof firstCategory === 'object' && firstCategory.slug) {
        categorySlug = firstCategory.slug
      } else if (typeof firstCategory === 'string') {
        categorySlug = firstCategory
      }
    }

    locales.forEach((locale) => {
      params.push({
        category: categorySlug,
        slug: post.slug || post.id || '',
        locale,
      })
    })
  }

  return params
}

/**
 * The page component for a single blog post.
 * @param {object} props - The component props.
 * @param {Promise<{ category: string; slug: string; locale: string }>} props.params - The page parameters.
 * @returns {Promise<React.ReactElement>} A promise that resolves to the post page component.
 */
export default async function PostPage({
  params: paramsPromise,
}: {
  params: Promise<{ category: string; slug: string; locale: string }>
}) {
  const { category, slug, locale: rawLocale } = await paramsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })
  const postRes = await payload.find({
    collection: 'posts',
    where: {
      and: [{ slug: { equals: slug } }, ...(draft ? [] : [{ _status: { equals: 'published' } }])],
    },
    draft,
    limit: 1,
    depth: 2,
    locale,
  })
  const post = postRes.docs[0]
  if (!post) return notFound()

  const localePrefix = locale === 'es' ? '' : '/en'

  // If the category segment in the URL is a raw MongoDB ObjectID, permanently
  // redirect to the canonical URL that uses the real category slug.
  const MONGO_ID_RE = /^[0-9a-f]{24}$/i
  if (MONGO_ID_RE.test(category)) {
    const realCategory = post.categories?.[0]
    const realSlug =
      realCategory && typeof realCategory === 'object' && realCategory.slug
        ? realCategory.slug
        : 'general'
    redirect(`${localePrefix}/blog/${realSlug}/${slug}`)
  }

  const { minutes } = post.content?.content ? estimateReadingTimeFromLexical(post.content.content) : { minutes: 1 }
  const excerpt = post.meta?.description || undefined
  const headings = post.content?.content ? extractHeadingsFromLexical(post.content.content) : []

  const categories = post.categories || []
  const firstCategory =
    Array.isArray(categories) && categories.length > 0
      ? typeof categories[0] === 'string'
        ? { title: category }
        : categories[0]
      : { title: category }
  const fullUrl = `${getServerSideURL()}${localePrefix}/blog/${category}/${slug}`
  
  const breadcrumbs = [
    { name: locale === 'es' ? 'Inicio' : 'Home', url: locale === 'es' ? '/' : '/en' },
    { name: 'Blog', url: `${localePrefix}/blog` },
    { name: typeof firstCategory.title === 'string' ? firstCategory.title : category, url: `${localePrefix}/blog/${category}` },
    { name: post.title, url: fullUrl }
  ]

  const schema = generateSchema({ doc: post, collection: 'posts', url: fullUrl, breadcrumbs })

  const dominantColor =
    post.content?.heroImage &&
    typeof post.content.heroImage === 'object' &&
    'dominantColor' in post.content.heroImage &&
    post.content.heroImage.dominantColor
      ? (post.content.heroImage as MediaType).dominantColor
      : getFallbackColorBySlug(slug)

  return (
    <>
      <article className="pb-16 relative">
        <JsonLd schema={schema} post={post} locale={locale} siteUrl={getServerSideURL()} />
        <LivePreviewListener />
        <PayloadRedirects disableNotFound url={`${localePrefix}/blog/${category}/${slug}`} />

        <PostHero
          post={post}
          excerpt={excerpt as string | null}
          readingTime={minutes}
          mainCategory={{
            title: firstCategory.title || category,
            href: `/blog/${category}`,
          }}
          locale={locale}
        />
        {/* Mobile/Tablet TOC - Collapsible */}
        <div className="container pt-8 lg:hidden">
          <TableOfContents headings={headings} variant="mobile" />
        </div>

        {/* Main Content Grid */}
        <div className="pt-8 lg:pt-12 container max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 lg:gap-16">
            {/* Main Article Content */}
            <article className="prose prose-xl dark:prose-invert max-w-none min-w-0">
              {post.content?.content && <RichText data={post.content.content} enableGutter={false} />}
            </article>

            {/* Sticky TOC Sidebar (Desktop Only) */}
            {headings && headings.length > 0 && (
              <aside className="hidden lg:block sticky top-32 h-fit">
                <TableOfContents headings={headings} variant="desktop" />
              </aside>
            )}
          </div>

          {/* Author Attribution */}
          {post.authors &&
            post.authors.length > 0 &&
            (() => {
              const firstAuthor = post.authors[0]
              if (typeof firstAuthor === 'object' && firstAuthor) {
                return (
                  <div className="max-w-3xl mx-auto mt-12">
                    <AuthorCard author={firstAuthor} />
                  </div>
                )
              }
              return null
            })()}

          {/* Related Posts */}
          {categories.length > 0 && (
            <RelatedPostsServer
              currentPostId={post.id}
              categoryIds={categories.map(cat => typeof cat === 'string' ? cat : cat.id)}
              locale={locale}
            />
          )}
        </div>
      </article>
      <DynamicBackground color={dominantColor} />
    </>
  )
}

/**
 * Generates metadata for the post page.
 * @param {object} props - The component props.
 * @param {Promise<{ category: string; slug: string; locale: string }>} props.params - The page parameters.
 * @returns {Promise<Metadata>} A promise that resolves to the page metadata.
 */
export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{ category: string; slug: string; locale: string }>
}): Promise<Metadata> {
  const { slug, locale: rawLocale, category } = await paramsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'
  const payload = await getPayload({ config: configPromise })
  const postRes = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
    locale,
  })
  const post = postRes.docs[0]
  return generateMeta({ doc: post, locale, path: `/blog/${category}/${slug}` })
}
