/**
 * @file Defines the page for a single case study.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import RichText from '@/components/RichText'

// Note: Related posts/categories not used in this page

import { PostHero } from '@/heros/PostHero'
import { estimateReadingTimeFromLexical } from '@/utilities/estimateReadingTime'
import { generateMeta } from '@/utilities/generateMeta'
import { extractHeadingsFromLexical } from '@/utilities/extractHeadings'
import { TableOfContents } from '@/components/TableOfContents'
import TOCClient from '@/components/TableOfContents/client'
import PageClient from '../../blog/page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
// import { headers } from 'next/headers'

/**
 * Generates static parameters for all case studies.
 * @returns {Promise<Array<{ slug: string }>>} A promise that resolves to an array of case study slugs.
 */
export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'case-studies',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  // Only emit params that have a string slug
  const params = posts.docs
    .map(({ slug }) => (typeof slug === 'string' && slug ? { slug } : null))
    .filter(Boolean)

  return params as { slug: string }[]
}

/**
 * @typedef {object} Args
 * @property {Promise<{ slug?: string }>} params - The page parameters.
 */
type Args = {
  params: Promise<{
    slug?: string
  }>
}

/**
 * The page component for a single case study.
 * @param {Args} props - The component props.
 * @returns {Promise<React.ReactElement>} A promise that resolves to the case study page component.
 */
export default async function CaseStudy({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = '' } = await paramsPromise
  const url = '/case-studies/' + slug
  const post = await queryCaseBySlug({ slug })

  // If post not found, redirect/handle before accessing fields
  if (!post) return <PayloadRedirects url={url} />

  // Calculate reading time and excerpt
  const { minutes } = post.content ? estimateReadingTimeFromLexical(post.content) : { minutes: 1 }
  const excerpt = post.meta?.description || undefined
  const headings = post.content ? extractHeadingsFromLexical(post.content) : []

  // Related posts feature disabled (no relatedPosts/categories in schema)

  if (!post) return <PayloadRedirects url={url} />

  return (
    <article className="pb-16">
      <PageClient />

      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      {/* Breadcrumbs */}
      <div className="container mt-4">
        {/* @ts-expect-error Async Server Component */}
        {(await import('@/components/Breadcrumbs')).default({
          items: [
            { label: 'Inicio', href: '/' },
            { label: 'Casos de Estudio', href: '/case-studies' },
            { label: post.title || 'Case Study' },
          ],
        })}
      </div>

      <PostHero post={post} excerpt={excerpt as string | null} readingTime={minutes} />

      <div className="flex flex-col items-center gap-4 pt-8">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,75ch)] gap-8 items-start">
            {/* LEFT: TOC sticky on desktop */}
            <aside className="hidden lg:block lg:col-start-1 lg:col-span-1">
              <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-auto">
                {headings && headings.length > 0 && <TableOfContents headings={headings} />}
              </div>
            </aside>

            {/* Main content */}
            <div className="lg:col-start-2 lg:col-span-1">
              {/* Mobile/tablet TOC above content */}
              {headings && headings.length > 0 && (
                <div className="lg:hidden mb-4">
                  <TableOfContents headings={headings} />
                </div>
              )}
              <div className="prose prose-lg dark:prose-invert max-w-none">
                {(() => {
                  type Lexical = import('@/payload-types').CaseStudy['content']['content']
                  const contentNode = post?.content as unknown
                  const contentData: Lexical | undefined =
                    contentNode &&
                    typeof contentNode === 'object' &&
                    'content' in (contentNode as Record<string, unknown>)
                      ? ((contentNode as { content?: Lexical }).content as Lexical | undefined)
                      : (contentNode as Lexical | undefined)
                  const hasNodes = Boolean(
                    (contentData as { root?: { children?: unknown[] } } | undefined)?.root
                      ?.children &&
                      (
                        (contentData as { root?: { children?: unknown[] } } | undefined)!.root!
                          .children as unknown[]
                      ).length > 0,
                  )
                  if (hasNodes) {
                    // @ts-expect-error accept Lexical JSON
                    return <RichText className="" data={contentData} enableGutter={false} />
                  }
                  return (
                    <div className="text-muted text-center py-12">
                      <p>Este artículo aún no tiene contenido.</p>
                      <p className="text-sm mt-2">
                        Agrega contenido desde el panel de administración.
                      </p>
                    </div>
                  )
                })()}
              </div>
              <TOCClient />
              {/* Related posts disabled */}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

/**
 * Generates metadata for the case study page.
 * @param {Args} props - The component props.
 * @returns {Promise<Metadata>} A promise that resolves to the page metadata.
 */
export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const post = await queryCaseBySlug({ slug })

  return generateMeta({ doc: post })
}

/**
 * Queries a case study by its slug.
 * @param {object} args - The arguments.
 * @param {string} args.slug - The case study slug.
 * @returns {Promise<any>} A promise that resolves to the case study data.
 */
const queryCaseBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  // Try find by slug first
  const result = await payload.find({
    collection: 'case-studies',
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  let doc = result.docs?.[0] || null

  // If not found and slug looks like an object id, try findByID as a fallback
  const looksLikeId = typeof slug === 'string' && /^[0-9a-fA-F]{24}$/.test(slug)
  if (!doc && looksLikeId) {
    try {
      const byId = await payload.findByID({ id: slug, collection: 'case-studies', depth: 0 })
      if (byId) doc = byId as unknown as import('@/payload-types').CaseStudy
    } catch {
      // ignore
    }
  }

  return doc
})