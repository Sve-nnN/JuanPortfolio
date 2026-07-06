/**
 * @file Defines the server-side component for dynamic pages.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import { JsonLd } from '@/components/JsonLd'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import HomePage from '../home/HomePage'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import type { Home, Page as PageType } from '@/payload-types'
import { getCachedPageBySlug } from '@/utilities/getPages'
import { generateSchema } from '@/utilities/generateSchema'
import { getServerSideURL } from '@/utilities/getURL'

// ISR: prerender published pages and revalidate hourly. draftMode() below stays
// bypass-cookie-gated, so only preview requests (with the cookie) render
// dynamically. Issue #20.
export const revalidate = 3600

/**
 * Generates static parameters for all pages across all locales.
 * @returns {Promise<Array<{ slug: string, locale: string }>>} A promise that resolves to an array of parameters.
 */
export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const pages = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const locales = ['en', 'es']

  const params = pages.docs
    ?.filter((doc) => {
      // `blog` and `case-studies` are served by dedicated folder routes (shadow [slug]);
      // excluding them here avoids duplicate params / double render.
      return doc.slug !== 'home' && doc.slug !== 'blog' && doc.slug !== 'case-studies'
    })
    .flatMap(({ slug }) => {
      return locales.map((locale) => ({ slug, locale }))
    })

  // Add home for both locales
  locales.forEach(locale => {
    params.push({ slug: 'home', locale })
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
 * The main component for rendering a page.
 * @param {Args} props - The component props.
 * @returns {Promise<React.ReactElement>} A promise that resolves to the page component.
 */
export default async function Page({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = 'home', locale: rawLocale } = await paramsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'
  const url = (locale === 'es' ? '' : '/' + locale) + '/' + slug

  // Home reads the Pages `home` entry (content.layout) with a FALLBACK to the
  // `home` global when the Page does not exist yet (migration pending). This makes a
  // single deploy safe: `/` renders IDENTICALLY pre-migration. The fallback is removed
  // in Phase 58. Draft branch (live preview) is cookie-gated and uncached; the public
  // path stays exclusively on the tag-cached read to preserve ISR/x-vercel-cache HIT.
  if (slug === 'home') {
    // Draft-aware read for live preview (mirrors queryPageBySlug: cache(), draft:true,
    // overrideAccess:true, depth:2). Never used on the public path.
    const page = draft
      ? await queryHomePageDraft(locale).catch(() => null)
      : await getCachedPageBySlug('home', 2, locale)().catch(() => null)

    // Derive layout with FALLBACK: prefer the Page content.layout; if the Page is
    // absent, read the `home` global (identical to pre-migration render).
    let layout = page?.content?.layout
    if (!page) {
      const payload = await getPayload({ config: configPromise })
      const homeGlobal = (await payload.findGlobal({
        slug: 'home',
        depth: 2,
        draft,
        locale,
      })) as Home
      layout = homeGlobal.layout
    }

    return (
      <main className="pb-24">
        <JsonLd isHome={true} blocks={layout} locale={locale} siteUrl={getServerSideURL()} />
        <PageClient />
        <PayloadRedirects disableNotFound url={url} />
        {draft && <LivePreviewListener />}
        {/* HomePage renders the home layout (Pages content.layout or global fallback) */}
        <HomePage layout={layout} locale={locale} />
      </main>
    )
  }

  // For other pages, use the pages collection
  const page = await queryPageBySlug({
    slug,
    locale,
  })

  if (!page) {
    return <PayloadRedirects url={url} />
  }

  const { hero, content } = page
  let layout = content?.layout || []

  // Handle case where layout might be an object due to previous localization setting
  if (layout && !Array.isArray(layout) && typeof layout === 'object') {
    // @ts-expect-error - Handling legacy localized layout
    layout = layout[locale] || layout.es || []
  }

  // Calculate JSON-LD
  // @ts-expect-error - URLSearchParams type mismatch in Next.js types
  const customJsonLd = page.meta?.jsonLD || page.meta_group?.jsonLD
  let schema = customJsonLd

  if (!schema) {
    const fullUrl = `${getServerSideURL()}${locale === 'es' ? '' : '/' + locale}/${slug}`
    schema = generateSchema({ doc: page, collection: 'pages', url: fullUrl })
  }

  return (
    <main className="pb-24">
      <JsonLd schema={schema} />
      <PageClient />
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <RenderHero {...hero} locale={locale} />
      <RenderBlocks blocks={layout} locale={locale} />
    </main>
  )
}

/**
 * Generates metadata for the page.
 * @param {Args} props - The component props.
 * @returns {Promise<Metadata>} A promise that resolves to the page metadata.
 */
export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = 'home', locale: rawLocale } = await paramsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'

  const payload = await getPayload({ config: configPromise })
  if (slug === 'home') {
    // Read the Pages `home` entry with FALLBACK to the `home` global (migration pending).
    // generateMeta is source-agnostic (validated on blog): hreflang/canonical/lang stay
    // correct. No `path` is passed so the home canonical is unchanged.
    const page = await getCachedPageBySlug('home', 2, locale)().catch(() => null)
    const doc = page ?? (await payload.findGlobal({ slug: 'home', locale }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return generateMeta({ doc: doc as any, locale })
  }
  if (slug === 'blog-listing') {
    const blogListingGlobal = await payload.findGlobal({
      slug: 'blog-listing',
      locale,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return generateMeta({ doc: blogListingGlobal as any, locale })
  }
  if (slug === 'case-studies-listing') {
    const caseStudiesListingGlobal = await payload.findGlobal({
      slug: 'case-studies-listing',
      locale,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return generateMeta({ doc: caseStudiesListingGlobal as any, locale })
  }
  const page = await queryPageBySlug({
    slug,
    locale,
  })
  return generateMeta({ doc: page, locale })
}

/**
 * Queries a page by its slug.
 * @param {object} args - The arguments.
 * @param {string} args.slug - The page slug.
 * @param {'en' | 'es' | 'all' | undefined} args.locale - The locale.
 * @returns {Promise<any>} A promise that resolves to the page data.
 */
/**
 * Draft-aware, per-request fetch of the `home` Page for live preview.
 * Mirrors queryPageBySlug: react cache(), draft:true, overrideAccess:true, depth:2.
 * Never used on the public (non-draft) path — that stays on getCachedPageBySlug.
 */
const queryHomePageDraft = cache(async (locale: 'en' | 'es'): Promise<PageType | null> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'pages',
    draft: true,
    limit: 1,
    depth: 2,
    pagination: false,
    overrideAccess: true,
    locale,
    where: {
      slug: {
        equals: 'home',
      },
    },
  })
  return result.docs?.[0] ?? null
})

const queryPageBySlug = cache(
  async ({ slug, locale }: { slug: string; locale?: 'en' | 'es' | 'all' | undefined }) => {
    const { isEnabled: draft } = await draftMode()

    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'pages',
      draft,
      limit: 1,
      depth: 2,
      pagination: false,
      overrideAccess: draft,
      locale: locale || undefined,
      where: {
        slug: {
          equals: slug,
        },
      },
    })

    return result.docs?.[0] || null
  },
)