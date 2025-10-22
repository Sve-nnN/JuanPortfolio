import type { Metadata } from 'next'

import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import RichText from '@/components/RichText'

import type { Post } from '@/payload-types'

import { PostHero } from '@/heros/PostHero'
import { estimateReadingTimeFromLexical } from '@/utilities/estimateReadingTime'
import { generateMeta } from '@/utilities/generateMeta'
import { extractHeadingsFromLexical } from '@/utilities/extractHeadings'
import { TableOfContents } from '@/components/TableOfContents'
import TOCClient from '@/components/TableOfContents/client'
import PageClient from '../../blog/page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { headers } from 'next/headers'

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

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function CaseStudy({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = '' } = await paramsPromise
  const url = '/case-studies/' + slug
  const post = await queryCaseBySlug({ slug })

  // Calculate reading time and excerpt
  const { minutes } = post?.content ? estimateReadingTimeFromLexical(post.content) : { minutes: 1 }
  const excerpt = post?.meta?.description || undefined
  const headings = post?.content ? extractHeadingsFromLexical(post.content) : []

  // detect locale from Accept-Language header for simple i18n
  const hdrs = await headers()
  const acceptLanguage = hdrs.get('accept-language') || undefined
  const rawLocale = acceptLanguage ? acceptLanguage.split(',')[0].split('-')[0] : undefined
  const locale = rawLocale && ['en', 'es'].includes(rawLocale) ? (rawLocale as 'en' | 'es') : 'es'

  // Small i18n helper for the related posts heading
  const relatedHeadingPrefix: Record<string, string> = {
    en: 'Read more about',
    es: 'Lee más sobre',
  }

  // If the author didn't manually set relatedPosts, query for up to 3 posts
  // that share any category with the current post (exclude current post)
  let fallbackRelated: Post[] | undefined = undefined
  if (
    (!post.relatedPosts || post.relatedPosts.length === 0) &&
    post.categories &&
    post.categories.length > 0
  ) {
    try {
      const configPromise = (await import('@payload-config')).default
      const { getPayload } = await import('payload')
      const payload = await getPayload({ config: configPromise })

      const categoryIds = (post.categories || [])
        .map((c: unknown) => {
          if (typeof c === 'string') return c
          if (c && typeof c === 'object')
            return (
              (c as { id?: string; value?: string }).id ||
              (c as { id?: string; value?: string }).value
            )
          return undefined
        })
        .filter(Boolean) as string[]

      if (categoryIds.length > 0) {
        const res = await payload.find({
          collection: 'case-studies',
          limit: 3,
          depth: 1,
          sort: '-publishedAt',
          where: {
            and: [
              {
                id: {
                  not_equals: post.id,
                },
              },
              {
                or: categoryIds.map((id: string) => ({
                  categories: {
                    contains: id,
                  },
                })),
              },
            ],
          },
        })

        fallbackRelated = (res.docs as Post[]) || []
      }
    } catch {
      // ignore and keep fallback undefined
    }
  }

  if (!post) return <PayloadRedirects url={url} />

  return (
    <article className="pb-16">
      <PageClient />

      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <PostHero post={post} excerpt={excerpt as string | null} readingTime={minutes} />

      <div className="flex flex-col items-center gap-4 pt-8">
        <div className="container">
          {headings && headings.length > 0 && (
            <div className="max-w-[60ch] mx-auto">
              <TableOfContents headings={headings} />
            </div>
          )}
          <div className="prose prose-lg dark:prose-invert max-w-[60ch] mx-auto">
            <RichText className="" data={post.content} enableGutter={false} />
          </div>
          <TOCClient />
          {(post.relatedPosts && post.relatedPosts.length > 0) ||
          (fallbackRelated && fallbackRelated.length > 0) ? (
            <div className="mt-12 max-w-[52rem] lg:grid lg:grid-cols-subgrid col-start-1 col-span-3 grid-rows-[2fr]">
              {/* Heading with i18n prefix and category name (use first category) */}
              <h3 className="text-2xl font-display font-bold mb-4">
                {relatedHeadingPrefix[locale]}{' '}
                {(() => {
                  const first =
                    post.categories && post.categories.length > 0 ? post.categories[0] : undefined
                  if (!first) return ''
                  if (typeof first === 'string') return first
                  return (
                    (first as { title?: string; label?: string }).title ||
                    (first as { title?: string; label?: string }).label ||
                    ''
                  )
                })()}
              </h3>

              <RelatedPosts
                className=""
                docs={
                  post.relatedPosts && post.relatedPosts.length > 0
                    ? (post.relatedPosts.filter((p) => typeof p === 'object') as Post[])
                    : fallbackRelated || []
                }
              />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const post = await queryCaseBySlug({ slug })

  return generateMeta({ doc: post })
}

const queryCaseBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  // Try find by slug first
  let result = await payload.find({
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
      if (byId) doc = byId as any
    } catch {
      // ignore
    }
  }

  return doc
})
