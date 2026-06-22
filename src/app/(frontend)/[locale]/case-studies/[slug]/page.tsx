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
import { JsonLd } from '@/components/JsonLd'
import Breadcrumbs from '@/components/Breadcrumbs'
import { getFallbackBySlug } from '@/constants/fallbackImages'
import { generateBreadcrumbSchema } from '@/utilities/schema/generateBreadcrumbSchema'
// import { headers } from 'next/headers'

/**
 * Generates static parameters for all case studies across all locales.
 * @returns {Promise<Array<{ slug: string, locale: string }>>} A promise that resolves to an array of parameters.
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

  const locales = ['en', 'es']

  // Only emit params that have a string slug
  const params = posts.docs
    .flatMap(({ slug }) => {
      if (typeof slug === 'string' && slug) {
        return locales.map((locale) => ({ slug, locale }))
      }
      return []
    })

  return params
}

/**
 * @typedef {object} Args
 * @property {Promise<{ slug?: string, locale: string }>} params - The page parameters.
 */
type Args = {
  params: Promise<{
    slug?: string
    locale: string
  }>
}

/**
 * The page component for a single case study.
 * @param {Args} props - The component props.
 * @returns {Promise<React.ReactElement>} A promise that resolves to the case study page component.
 */
export default async function CaseStudy({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = '', locale: rawLocale } = await paramsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'
  const url = (locale === 'es' ? '' : '/' + locale) + '/case-studies/' + slug
  const post = await queryCaseBySlug({ slug, locale })

  // If post not found, redirect/handle before accessing fields
  if (!post) return <PayloadRedirects url={url} />

  // Calculate reading time and excerpt
  const { minutes } = post.content ? estimateReadingTimeFromLexical(post.content) : { minutes: 1 }
  const excerpt = post.meta?.description || undefined
  const headings = post.content ? extractHeadingsFromLexical(post.content) : []

  // Related posts feature disabled (no relatedPosts/categories in schema)

  if (!post) return <PayloadRedirects url={url} />

  // Calculate JSON-LD
  // @ts-expect-error - URLSearchParams type mismatch
  const customJsonLd = post.meta?.jsonLD || post.meta_group?.jsonLD
  let schema = customJsonLd

  if (!schema) {
    // @ts-expect-error - URLSearchParams type mismatch
    const metaTitle = post.meta?.title || post.meta_group?.title || post.title
    // @ts-expect-error - URLSearchParams type mismatch
    const metaDesc = post.meta?.description || post.meta_group?.description
    // @ts-expect-error - URLSearchParams type mismatch
    const metaImage = post.meta?.image?.url || post.meta?.image?.sizes?.og?.url || post.meta_group?.image?.url

    // SEO audit jun-2026, issue #28: the TechArticle lacked publisher, a fully
    // referenced author, an image fallback and a BreadcrumbList. Emit a complete
    // node graph (JsonLd flattens the @graph container).
    const SERVER = process.env.NEXT_PUBLIC_SERVER_URL || ''
    const localePrefix = locale === 'es' ? '' : '/en'
    const absoluteUrl = `${SERVER}${url}`

    const techArticle = {
      '@type': 'TechArticle', // Good for case studies
      '@id': absoluteUrl,
      headline: metaTitle,
      description: metaDesc,
      image: metaImage ? `${SERVER}${metaImage}` : getFallbackBySlug(slug),
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: {
        '@type': 'Person',
        '@id': `${SERVER}/#person`,
        name: 'Juan Carlos Angulo',
        url: `${SERVER}/authors/juan-carlos-angulo`,
      },
      publisher: {
        '@id': `${SERVER}/#organization`,
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': absoluteUrl,
      },
    }

    const breadcrumb = generateBreadcrumbSchema([
      { name: locale === 'es' ? 'Inicio' : 'Home', url: localePrefix || '/' },
      { name: locale === 'es' ? 'Casos de estudio' : 'Case studies', url: `${localePrefix}/case-studies` },
      { name: metaTitle, url },
    ])

    schema = {
      '@context': 'https://schema.org',
      '@graph': breadcrumb ? [techArticle, breadcrumb] : [techArticle],
    }
  }

  return (
    <article className="pb-16">
      <JsonLd schema={schema} />
      <PageClient />

      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      {/* Breadcrumbs */}
      <div className="container mt-4">
        <Breadcrumbs
          items={[
            { label: locale === 'es' ? 'Inicio' : 'Home', href: locale === 'es' ? '/' : '/en' },
            { label: locale === 'es' ? 'Casos de Estudio' : 'Case Studies', href: locale === 'es' ? '/case-studies' : '/en/case-studies' },
            { label: post.title || 'Case Study' },
          ]}
        />
      </div>

      <PostHero post={post} excerpt={excerpt as string | null} readingTime={minutes} locale={locale} />

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
                      <p>{locale === 'es' ? 'Este artículo aún no tiene contenido.' : 'This article has no content yet.'}</p>
                      <p className="text-sm mt-2">
                        {locale === 'es' ? 'Agrega contenido desde el panel de administración.' : 'Add content from the admin panel.'}
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
  const { slug = '', locale: rawLocale } = await paramsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'
  const post = await queryCaseBySlug({ slug, locale })

  return generateMeta({ doc: post, locale, path: `/case-studies/${slug}` })
}

/**
 * Queries a case study by its slug.
 * @param {object} args - The arguments.
 * @param {string} args.slug - The case study slug.
 * @param {'en' | 'es'} args.locale - The locale.
 * @returns {Promise<any>} A promise that resolves to the case study data.
 */
const queryCaseBySlug = cache(async ({ slug, locale }: { slug: string, locale?: 'en' | 'es' }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  // Try find by slug first
  const result = await payload.find({
    collection: 'case-studies',
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    locale,
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
      const byId = await payload.findByID({ id: slug, collection: 'case-studies', depth: 0, locale })
      if (byId) doc = byId as unknown as import('@/payload-types').CaseStudy
    } catch {
      // ignore
    }
  }

  return doc
})