/**
 * @file Defines the server-side component for dynamic pages.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import { JsonLd } from '@/components/JsonLd'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode, headers } from 'next/headers'
import React, { cache } from 'react'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import HomePage from '@/app/(frontend)/home/HomePage'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

/**
 * Generates static parameters for all pages.
 * @returns {Promise<Array<{ slug: string }>>} A promise that resolves to an array of page slugs.
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

  const params = pages.docs
    ?.filter((doc) => {
      return doc.slug !== 'home'
    })
    .map(({ slug }) => {
      return { slug }
    })

  return params
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
 * The main component for rendering a page.
 * @param {Args} props - The component props.
 * @returns {Promise<React.ReactElement>} A promise that resolves to the page component.
 */
export default async function Page({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = 'home' } = await paramsPromise
  const url = '/' + slug

  // detect locale from Accept-Language header
  const hdrs = await headers()
  const acceptLanguage = hdrs.get('accept-language') || undefined
  const rawLocale = acceptLanguage ? acceptLanguage.split(',')[0].split('-')[0] : undefined
  const locale =
    rawLocale && ['en', 'es'].includes(rawLocale) ? (rawLocale as 'en' | 'es') : undefined

  // If this is the home slug, use the global 'home' instead of pages collection
  if (slug === 'home') {
    const payload = await getPayload({ config: configPromise })
    const homeGlobal = await payload.findGlobal({
      slug: 'home',
      draft,
      locale,
    })

    return (
      <article className="pb-24">
        <PageClient />
        <PayloadRedirects disableNotFound url={url} />
        {draft && <LivePreviewListener />}
        {/* HomePage will render content from the home global */}
        <HomePage homeGlobal={homeGlobal} />
      </article>
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
  const layout = content?.layout || []

  // Calculate JSON-LD
  // @ts-ignore
  const customJsonLd = page.meta_group?.jsonLD
  let schema = customJsonLd

  if (!schema) {
    const metaTitle = page.meta_group?.title || page.title
    const metaDesc = page.meta_group?.description
    // @ts-ignore
    const metaImage = page.meta_group?.image?.url || page.meta_group?.image?.sizes?.og?.url

    schema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: metaTitle,
      description: metaDesc,
      image: metaImage ? `${process.env.NEXT_PUBLIC_SERVER_URL}${metaImage}` : undefined,
      datePublished: page.publishedAt,
      dateModified: page.updatedAt,
      publisher: {
        '@type': 'Organization',
        name: 'Juan Tech', // Should be dynamic from global settings
      }
    }
  }

  return (
    <article className="pb-24">
      <JsonLd schema={schema} />
      <PageClient />
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <RenderHero {...hero} />
      <RenderBlocks blocks={layout} />
    </article>
  )
}

/**
 * Generates metadata for the page.
 * @param {Args} props - The component props.
 * @returns {Promise<Metadata>} A promise that resolves to the page metadata.
 */
export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = 'home' } = await paramsPromise
  // detect locale from headers (loose cast)
  const hdrs2 = await headers()
  const acceptLanguage2 = hdrs2.get('accept-language') || undefined
  const rawLocale2 = acceptLanguage2 ? acceptLanguage2.split(',')[0].split('-')[0] : undefined
  const locale =
    rawLocale2 && ['en', 'es'].includes(rawLocale2) ? (rawLocale2 as 'en' | 'es') : undefined

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