/**
 * @file Defines the page for a single blog post.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound, permanentRedirect } from 'next/navigation'
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
import { extractFaqsFromLexical } from '@/utilities/extractFaqs'
import { generateFAQSchema } from '@/utilities/schema'
import { getServerSideURL } from '@/utilities/getURL'
import { getCanonicalCategorySlug } from '@/utilities/postUrl'
import type { Media as MediaType } from '@/payload-types'

// ISR: prerender published posts and revalidate hourly. draftMode() stays
// bypass-cookie-gated for preview. Issue #20.
export const revalidate = 3600

/**
 * Generates static parameters for all blog posts across all locales.
 * @returns {Promise<Array<{ category: string; slug: string; locale: string }>>} A promise that resolves to an array of parameters.
 */
export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const locales: Array<'en' | 'es'> = ['es', 'en']
  const params: Array<{ category: string; slug: string; locale: string }> = []

  // Query per locale so each locale's params use that locale's slug (a post can
  // have a different slug per language). Issue #101 (BUG-06).
  for (const locale of locales) {
    const posts = await payload.find({
      collection: 'posts',
      limit: 1000,
      depth: 1,
      draft: false,
      locale,
      where: { _status: { equals: 'published' } },
    })

    for (const post of posts.docs) {
      if (!post.slug) continue
      params.push({
        category: getCanonicalCategorySlug(post),
        slug: post.slug,
        locale,
      })
    }
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

  // A post has exactly one canonical category (its first). Any other category
  // segment — a secondary category, a raw ObjectID, or a bogus string — serves
  // identical content under a duplicate URL that self-canonicalizes. 301 to the
  // canonical path so signals consolidate and hreflang stays reciprocal. Issue #85.
  const canonicalCategory = getCanonicalCategorySlug(post)
  if (category !== canonicalCategory) {
    // 308 permanent (not 307) so Google consolidates the duplicate variant's
    // signals onto the canonical URL. Issue #85.
    permanentRedirect(`${localePrefix}/blog/${canonicalCategory}/${slug}`)
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

  // SEO audit jun-2026, issue #46: if the post embeds an FAQ block, emit a
  // FAQPage node alongside the BlogPosting/Breadcrumb graph for AI/answer-engine
  // extraction. JsonLd flattens the @graph container.
  const faqs = post.content?.content ? extractFaqsFromLexical(post.content.content) : []
  if (
    faqs.length >= 2 &&
    schema &&
    typeof schema === 'object' &&
    Array.isArray((schema as { '@graph'?: unknown[] })['@graph'])
  ) {
    ;(schema as { '@graph': unknown[] })['@graph'].push(
      generateFAQSchema(faqs as { question: string; answer: string }[]),
    )
  }

  const dominantColor =
    post.content?.heroImage &&
    typeof post.content.heroImage === 'object' &&
    'dominantColor' in post.content.heroImage &&
    post.content.heroImage.dominantColor
      ? (post.content.heroImage as MediaType).dominantColor
      : getFallbackColorBySlug(slug)

  return (
    <>
      {/* <main> landmark for the post template (a11y: landmark-one-main).
          The inner <article> below still wraps the post body. SEO audit #70. */}
      <main className="pb-16 relative">
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
      </main>
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
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })
  // Mirror the page's filter: don't emit indexable metadata for drafts. Issue #100 (BUG-05).
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
  // Canonical + hreflang from the post's real category, never from the requested
  // params, so every category variant points at the same canonical URL. Issue #85.
  const canonicalCategory = post ? getCanonicalCategorySlug(post) : category
  return generateMeta({ doc: post, locale, path: `/blog/${canonicalCategory}/${slug}` })
}
