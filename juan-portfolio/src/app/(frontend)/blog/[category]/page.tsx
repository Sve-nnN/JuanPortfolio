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
import Link from 'next/link'
import { CategoryFAQ } from '@/components/CategoryFAQ'
import { CategoryExplore } from '@/components/CategoryExplore'
import { Metadata } from 'next'
import { CategoryHeader } from './CategoryHeader'
import { JsonLd } from '@/components/JsonLd'
import {
  generateCollectionPageSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
  mergeSchemas,
  type BreadcrumbItem,
  type FAQItem,
} from '@/utilities/schema'

/**
 * Generates static parameters for all blog categories.
 * @returns {Promise<Array<{ category: string }>>} A promise that resolves to an array of category slugs.
 */
export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const categories = await payload.find({
    collection: 'categories',
    limit: 100,
    select: { slug: true },
  })
  return categories.docs.map(({ slug }) => ({ category: slug }))
}

/**
 * The page component for a specific blog category.
 * @param {object} props - The component props.
 * @param {Promise<{ category: string }>} props.params - The page parameters.
 * @returns {Promise<React.ReactElement>} A promise that resolves to the category page component.
 */
export default async function CategoryPage({
  params
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })
  // Buscar por slug primero, si no existe, buscar por id
  let categoryRes = await payload.find({
    collection: 'categories',
    where: { slug: { equals: category } },
    draft,
    limit: 1,
    depth: 2,
  })
  let cat = categoryRes.docs[0]
  if (!cat) {
    categoryRes = await payload.find({
      collection: 'categories',
      where: { id: { equals: category } },
      draft,
      limit: 1,
      depth: 2,
    })
    cat = categoryRes.docs[0]
  }
  if (!cat) return notFound()

  const posts = await payload.find({
    collection: 'posts',
    where: { categories: { contains: cat.id } },
    draft,
    limit: 100,
    depth: 2,
  })
  const allCategories = await payload.find({ collection: 'categories', limit: 100 })

  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || ''
  const breadcrumbItems: BreadcrumbItem[] = [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: cat.title || 'Categoría', url: `/blog/${cat.slug}` },
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

  return (
    <main>
      <JsonLd schema={schema} />
      <CategoryHeader 
        title={cat.title || 'Categoría'}
        description={cat.description || undefined}
        categorySlug={cat.slug || ''}
        backgroundImage={getFallbackBySlug(cat.slug || '') || ''}
      />
      <PostsGrid
        blockType="postsGrid"
        overridePosts={posts.docs as Post[]}
        showCategories={false}
        gridColumns="3"
      />
      {cat.faqs && cat.faqs.length > 0 && <CategoryFAQ faqs={cat.faqs as Array<{ question: string; answer: string }>} />}
      <CategoryExplore categories={allCategories.docs} currentId={cat.id} />
    </main>
  )
}

/**
 * Generates metadata for the category page.
 * @param {object} props - The component props.
 * @param {Promise<{ category: string }>} props.params - The page parameters.
 * @returns {Promise<Metadata>} A promise that resolves to the page metadata.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  const payload = await getPayload({ config: configPromise })
  const categoryRes = await payload.find({
    collection: 'categories',
    where: { slug: { equals: category } },
    limit: 1,
    depth: 2,
  })
  const cat = categoryRes.docs[0]
  return {
    title: cat?.meta?.title || cat?.title || 'Categoría',
    description: cat?.meta?.description || cat?.description || '',
  }
}