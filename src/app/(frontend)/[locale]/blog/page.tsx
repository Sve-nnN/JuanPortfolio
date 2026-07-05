/**
 * @file Defines the main blog listing page.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import React, { cache } from 'react'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { getCachedPageBySlug } from '@/utilities/getPages'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import type { Page } from '@/payload-types'
import { generateMeta } from '@/utilities/generateMeta'
import { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { generateCollectionPageSchema, generateBreadcrumbSchema } from '@/utilities/schema'

/**
 * The main blog listing page component.
 * It reads the Pages collection entry `slug: 'blog'` from the CMS and renders its
 * content.layout blocks. If the entry does not exist yet (migration pending), it
 * degrades gracefully to a fallback message instead of throwing.
 * @returns {Promise<React.ReactElement>} A promise that resolves to the blog page component.
 */

// ISR: prerender published /blog and revalidate hourly. The draftMode() branch below
// stays bypass-cookie-gated, so only preview requests (with the cookie) render
// dynamically. Public stays static ISR — no no-store/force-dynamic. Issue #20.
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

/**
 * Draft-aware, per-request fetch of the `blog` Page for live preview.
 * Mirrors queryPageBySlug in [slug]/page.tsx: react cache(), draft:true,
 * overrideAccess:true, depth:2. Never used on the public (non-draft) path.
 */
const queryBlogPageDraft = cache(async (locale: 'en' | 'es'): Promise<Page | null> => {
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
        equals: 'blog',
      },
    },
  })
  return result.docs?.[0] ?? null
})

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale: rawLocale } = await paramsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'
  const page = (await getCachedPageBySlug('blog', 2, locale)().catch(() => null)) as Page | null
  // generateMeta is source-agnostic (global vs page): hreflang/canonical stay correct.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return generateMeta({ doc: page as any, locale, path: '/blog' })
}

const BlogPage = async ({ params: paramsPromise }: Args) => {
  const { isEnabled: draft } = await draftMode()
  const { locale: rawLocale } = await paramsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'

  // Draft branch (live preview): cookie-gated, uncached, draft-aware. Public path
  // below stays exclusively on the tag-cached read to preserve ISR/x-vercel-cache HIT.
  const page = draft
    ? await queryBlogPageDraft(locale).catch(() => null)
    : ((await getCachedPageBySlug('blog', 2, locale)().catch(() => null)) as Page | null)

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

  let layout = page?.content?.layout

  // Handle case where layout might be an object due to previous localization setting
  if (layout && !Array.isArray(layout) && typeof layout === 'object') {
    // @ts-expect-error - Handling legacy localized layout
    layout = layout[locale] || layout.es || []
  }

  // If the Page has layout blocks, render only content.layout (NOT page.hero — the
  // listing hero is the ListingHero block inside layout, not the collection hero tab).
  if (layout && Array.isArray(layout) && layout.length > 0) {
    return (
      <main>
        <JsonLd schema={listingSchema} />
        {draft && <LivePreviewListener />}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <RenderBlocks blocks={layout as any} locale={locale} />
      </main>
    )
  }

  // Fallback UI if the Page 'blog' entry does not exist yet (migration pending) or
  // has no blocks configured. Degrades safely instead of 500.
  const title = page && 'title' in page ? page.title : locale === 'es' ? 'Blog' : 'Engineering Blog'
  return (
    <main className="py-8">
      <JsonLd schema={listingSchema} />
      {draft && <LivePreviewListener />}
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">{title}</h1>
        <p className="text-center text-muted">
          {locale === 'es'
            ? 'Por favor, configura los bloques en la página "blog" (colección Pages) en el panel de administración. Considera usar el bloque "Archive" o "Posts Grid" para mostrar contenido.'
            : 'Please configure blocks in the "blog" Page (Pages collection) in Payload admin. Consider using the "Archive" or "Posts Grid" block to display content.'}
        </p>
      </div>
    </main>
  )
}

export default BlogPage
