/**
 * @file Defines the page for a single blog post.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { PostHero } from '@/heros/PostHero'
import { estimateReadingTimeFromLexical } from '@/utilities/estimateReadingTime'
import { extractHeadingsFromLexical } from '@/utilities/extractHeadings'
import { TableOfContents } from '@/components/TableOfContents'
import RichText from '@/components/RichText'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import { AnimateOnScroll } from '@/components/AnimateOnScroll'
import { Metadata } from 'next'
import { AuthorCard } from '@/components/AuthorCard'

/**
 * Generates static parameters for all blog posts.
 * @returns {Promise<Array<{ category: string; slug: string }>>} A promise that resolves to an array of post slugs with their categories.
 */
export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'posts',
    limit: 1000,
    depth: 2, // Necesitamos depth para obtener las categorías
  })

  const params: Array<{ category: string; slug: string }> = []

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

    params.push({
      category: categorySlug,
      slug: post.slug || post.id || '',
    })
  }

  return params
}

/**
 * The page component for a single blog post.
 * @param {object} props - The component props.
 * @param {Promise<{ category: string; slug: string }>} props.params - The page parameters.
 * @returns {Promise<React.ReactElement>} A promise that resolves to the post page component.
 */
export default async function PostPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>
}) {
  const { category, slug } = await params
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })
  const postRes = await payload.find({
    collection: 'posts',
    where: {
      and: [
        { slug: { equals: slug } },
        ...(draft ? [] : [{ _status: { equals: 'published' } }]),
      ],
    },
    draft,
    limit: 1,
    depth: 2,
  })
  const post = postRes.docs[0]
  if (!post) return notFound()

  const { minutes } = post.content ? estimateReadingTimeFromLexical(post.content) : { minutes: 1 }
  const excerpt = post.meta?.description || undefined
  const headings = post.content ? extractHeadingsFromLexical(post.content) : []

  const categories = post.categories || []
  const firstCategory =
    Array.isArray(categories) && categories.length > 0
      ? typeof categories[0] === 'string'
        ? { title: category }
        : categories[0]
      : { title: category }

  return (
    <article className="pb-16">
      <LivePreviewListener />
      <PayloadRedirects disableNotFound url={`/blog/${category}/${slug}`} />

      <PostHero
        post={post}
        excerpt={excerpt as string | null}
        readingTime={minutes}
        mainCategory={{
          title: firstCategory.title || category,
          href: `/blog/${category}`
        }}
      />
      {/* Mobile/Tablet TOC - Collapsible */}
      <div className="container pt-8 lg:hidden">
        <TableOfContents headings={headings} variant="mobile" />
      </div>

      {/* Main Content Grid */}
      <AnimateOnScroll className="pt-8 lg:pt-12 container">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 lg:gap-12 items-start">
          {/* Main Article Content */}
          <article className="prose prose-lg dark:prose-invert max-w-none min-w-0">
            {post.content?.content && <RichText data={post.content.content} enableGutter={false} />}
          </article>

          {/* Sticky TOC Sidebar (Desktop Only) */}
          {headings && headings.length > 0 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <TableOfContents headings={headings} variant="desktop" />
              </div>
            </aside>
          )}
        </div>

        {/* Author Attribution */}
        {post.authors && post.authors.length > 0 && (() => {
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
      </AnimateOnScroll>
    </article>
  )
}

/**
 * Generates metadata for the post page.
 * @param {object} props - The component props.
 * @param {Promise<{ category: string; slug: string }>} props.params - The page parameters.
 * @returns {Promise<Metadata>} A promise that resolves to the page metadata.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })
  const postRes = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })
  const post = postRes.docs[0]
  return {
    title: post?.meta?.title || post?.title || 'Post',
    description: post?.meta?.description || '',
  }
}