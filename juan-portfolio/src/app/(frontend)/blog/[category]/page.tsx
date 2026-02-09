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

  return (
    <main>
      <div className="relative min-h-[60vh] flex items-end justify-end pb-12 sm:pb-16 lg:pb-20 mb-8">

        {/* Background & Overlay */}
        <div className="absolute inset-0 z-0 select-none">
          <img
            src={getFallbackBySlug(cat.slug || '') || ''}
            alt="Hero Background"
            className="object-cover w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/60" />
        </div>

        <div className="container z-10 relative flex flex-col items-end text-right text-white">
          <div className="max-w-4xl w-full flex flex-col items-end gap-6 animate-fade-in-up">

            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap justify-end gap-2 items-center mb-0 text-sm font-medium uppercase tracking-wide text-white/80"
            >
              <Link className="hover:text-white transition-colors" href="/">
                Inicio
              </Link>
              <span className="text-white/40">/</span>
              <Link className="hover:text-white transition-colors" href="/blog">
                Blog
              </Link>
              <span className="text-white/40">/</span>
              <span className="text-primary-foreground bg-primary/20 px-2 py-0.5 rounded text-xs backdrop-blur-md border border-primary/20">
                {cat.title}
              </span>
            </nav>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white drop-shadow-sm leading-tight">
              {cat.title}
            </h1>

            {cat.description && (
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed max-w-2xl drop-shadow-sm">
                {cat.description}
              </p>
            )}
          </div>
        </div>
      </div>
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