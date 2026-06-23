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
import type { Home } from '@/payload-types'
import { generateSchema } from '@/utilities/generateSchema'
import { getServerSideURL } from '@/utilities/getURL'

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
      return doc.slug !== 'home'
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

  // If this is the home slug, use the global 'home' instead of pages collection
  if (slug === 'home') {
    const payload = await getPayload({ config: configPromise })
    const homeGlobal = (await payload.findGlobal({
      slug: 'home',
      depth: 2,
      draft,
      locale,
    })) as Home

    return (
      <main className="pb-24">
        <JsonLd
          isHome={true}
          blocks={homeGlobal.layout}
          locale={locale}
          siteUrl={getServerSideURL()}
        />
        <PageClient />
        <PayloadRedirects disableNotFound url={url} />
        {draft && <LivePreviewListener />}
        {/* HomePage will render content from the home global */}
        <HomePage homeGlobal={homeGlobal} locale={locale} />
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
    const homeGlobal = await payload.findGlobal({
      slug: 'home',
      locale,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return generateMeta({ doc: homeGlobal as any, locale })
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