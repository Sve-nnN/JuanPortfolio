/**
 * @file Defines the page for a specific blog category.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { PostsGrid } from '@/blocks/PostsGrid/Component'
import type { Post } from '@/payload-types'
import { getFallbackBySlug } from '@/constants/fallbackImages'
import { CategoryFAQ } from '@/components/CategoryFAQ'
import { CategoryExplore } from '@/components/CategoryExplore'
import { Metadata } from 'next'
import { CategoryHeader } from './CategoryHeader'
import { JsonLd } from '@/components/JsonLd'
import { generateMeta } from '@/utilities/generateMeta'
import {
  generateCollectionPageSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
  mergeSchemas,
  type BreadcrumbItem,
  type FAQItem,
} from '@/utilities/schema'

// ISR: prerender category pages and revalidate hourly. draftMode() stays
// bypass-cookie-gated for preview. Issue #20.
export const revalidate = 3600

/**
 * Generates static parameters for all blog categories across all locales.
 * @returns {Promise<Array<{ category: string, locale: string }>>} A promise that resolves to an array of parameters.
 */
export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const categories = await payload.find({
    collection: 'categories',
    limit: 100,
    select: { slug: true },
  })
  
  const locales = ['en', 'es']
  
  return categories.docs.flatMap(({ slug }) => 
    locales.map((locale) => ({ category: slug, locale }))
  )
}

/**
 * The page component for a specific blog category.
 * @param {object} props - The component props.
 * @param {Promise<{ category: string, locale: string }>} props.params - The page parameters.
 * @returns {Promise<React.ReactElement>} A promise that resolves to the category page component.
 */
export default async function CategoryPage({
  params: paramsPromise
}: {
  params: Promise<{ category: string, locale: string }>
}) {
  const { category, locale: rawLocale } = await paramsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })
  // Buscar por slug primero, si no existe, buscar por id
  let categoryRes = await payload.find({
    collection: 'categories',
    where: { slug: { equals: category } },
    draft,
    limit: 1,
    depth: 2,
    locale,
  })
  let cat = categoryRes.docs[0]
  if (!cat) {
    categoryRes = await payload.find({
      collection: 'categories',
      where: { id: { equals: category } },
      draft,
      limit: 1,
      depth: 2,
      locale,
    })
    cat = categoryRes.docs[0]
  }
  if (!cat) return notFound()

  const [posts, allCategories] = await Promise.all([
    payload.find({
      collection: 'posts',
      where: {
        and: [
          { categories: { contains: cat.id } },
          { _status: { equals: 'published' } },
        ],
      },
      limit: 100,
      depth: 2,
      locale,
    }),
    payload.find({ collection: 'categories', limit: 100, locale }),
  ])

  const localePrefix = locale === 'es' ? '' : '/en'
  const breadcrumbItems: BreadcrumbItem[] = [
    { name: locale === 'es' ? 'Inicio' : 'Home', url: localePrefix || '/' },
    { name: 'Blog', url: `${localePrefix}/blog` },
    { name: cat.title || 'Categoría', url: `${localePrefix}/blog/${cat.slug}` },
  ]
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems)

  const collectionPageSchema = generateCollectionPageSchema({
    name: cat.title || 'Categoría',
    description: cat.description || undefined,
    url: `/blog/${cat.slug}`,
    numberOfItems: posts.docs.length,
  })

  const faqSchema = cat.faqs && Array.isArray(cat.faqs) && cat.faqs.length >= 2
    ? generateFAQSchema(
        cat.faqs.map((faq) => ({
          question: String(faq.question),
          answer: String(faq.answer),
        })) as FAQItem[]
      )
    : null

  const schema = mergeSchemas([collectionPageSchema, faqSchema, breadcrumbSchema])

  const bgUrl = getFallbackBySlug(cat.slug || '') || ''

  return (
    <main>
      <JsonLd schema={schema} />
      <CategoryHeader 
        title={cat.title || 'Categoría'}
        description={cat.description || undefined}
        _categorySlug={cat.slug || category}
        backgroundImage={bgUrl}
      />
      <PostsGrid
        blockType="postsGrid"
        overridePosts={posts.docs as Post[]}
        showCategories={false}
        gridColumns="3"
      />
      {cat.faqs && cat.faqs.length > 0 && <CategoryFAQ faqs={cat.faqs as Array<{ question: string; answer: string }>} />}
      <div className="container mx-auto px-4 pb-20">
        <CategoryExplore categories={allCategories.docs} currentId={cat.id} locale={locale} />
      </div>
    </main>
  )
}

/**
 * Generates metadata for the category page.
 * @param {object} props - The component props.
 * @param {Promise<{ category: string, locale: string }>} props.params - The page parameters.
 * @returns {Promise<Metadata>} A promise that resolves to the page metadata.
 */
export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{ category: string, locale: string }>
}): Promise<Metadata> {
  const { category, locale: rawLocale } = await paramsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'
  const payload = await getPayload({ config: configPromise })
  const categoryRes = await payload.find({
    collection: 'categories',
    where: { slug: { equals: category } },
    limit: 1,
    depth: 2,
    locale,
  })
  const cat = categoryRes.docs[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return generateMeta({ doc: cat as any, locale, path: `/blog/${category}` })
}