/**
 * @file Defines the main blog listing page.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import React from 'react'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { BlogListing } from '@/payload-types'
import { generateMeta } from '@/utilities/generateMeta'
import { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import { generateCollectionPageSchema, generateBreadcrumbSchema } from '@/utilities/schema'

/**
 * The main blog listing page component.
 * It fetches the 'blog-listing' global from the CMS and renders its blocks.
 * If no blocks are configured, it displays a fallback message.
 * @returns {Promise<React.ReactElement>} A promise that resolves to the blog page component.
 */

export const revalidate = 3600
export const dynamicParams = true

// Enumerate the locales so /en/blog and /es/blog prerender as static ISR HTML
// instead of being rendered dynamically on demand. Issue #20.
export async function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }]
}

type Args = {
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale: rawLocale } = await paramsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'
  const blogGlobal = (await getCachedGlobal('blog-listing', 0, locale)().catch(() => null)) as BlogListing | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return generateMeta({ doc: blogGlobal as any, locale, path: '/blog' })
}

const BlogPage = async ({ params: paramsPromise }: Args) => {
  const { locale: rawLocale } = await paramsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'

  // Get blog listing global with blocks
  const blogGlobal = (await getCachedGlobal('blog-listing', 0, locale)().catch(() => null)) as BlogListing | null

  // CollectionPage + breadcrumb schema so the blog index isn't schema-less,
  // mirroring the category templates. SEO audit jun-2026, issue #29.
  const localePrefix = locale === 'es' ? '' : '/en'
  const listingSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      generateCollectionPageSchema({
        name: locale === 'es' ? 'Blog' : 'Engineering Blog',
        url: `${localePrefix}/blog`,
      }),
      ...(() => {
        const bc = generateBreadcrumbSchema([
          { name: locale === 'es' ? 'Inicio' : 'Home', url: localePrefix || '/' },
          { name: 'Blog', url: `${localePrefix}/blog` },
        ])
        return bc ? [bc] : []
      })(),
    ],
  }

  let layout = blogGlobal?.layout

  // Handle case where layout might be an object due to previous localization setting
  if (layout && !Array.isArray(layout) && typeof layout === 'object') {
    // @ts-expect-error - Handling legacy localized layout
    layout = layout[locale] || layout.es || []
  }

  // If global has layout blocks, render them
  if (layout && Array.isArray(layout) && layout.length > 0) {
    return (
      <main>
        <JsonLd schema={listingSchema} />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <RenderBlocks blocks={layout as any} locale={locale} />
      </main>
    )
  }

  // Fallback UI if no blocks configured
  const title = blogGlobal && 'title' in blogGlobal ? blogGlobal.title : (locale === 'es' ? 'Blog' : 'Engineering Blog')
  return (
    <main className="py-8">
      <JsonLd schema={listingSchema} />
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">{title}</h1>
        <p className="text-center text-muted">
          {locale === 'es' 
            ? 'Por favor, configura los bloques en el global "Blog Listing" en el panel de administración. Considera usar el bloque "Archive" o "Posts Grid" para mostrar contenido.' 
            : 'Please configure blocks in the "Blog Listing" global in Payload admin. Consider using the "Archive" or "Posts Grid" block to display content.'}
        </p>
      </div>
    </main>
  )
}

export default BlogPage