import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import Breadcrumbs from '@/components/Breadcrumbs'
import { BlogListingLayout } from '@/components/BlogListingLayout'
import { CategoryFAQ } from '@/components/CategoryFAQ'
import { CategoryExplore } from '@/components/CategoryExplore'
import { Metadata } from 'next'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const categories = await payload.find({
    collection: 'categories',
    limit: 100,
    select: { slug: true },
  })
  return categories.docs.map(({ slug }) => ({ category: slug }))
}

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
    where: { 'meta_extras.categories': { equals: cat.id } },
    draft,
    limit: 100,
    depth: 2,
  })
  const allCategories = await payload.find({ collection: 'categories', limit: 100 })

  return (
    <main>
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Blog', href: '/blog' },
          { label: cat.title, href: `/blog/${cat.slug}` },
        ]}
      />
      <h1 className="text-4xl font-bold mb-2">{cat.title}</h1>
      {cat.description && <p className="mb-6 text-lg text-muted-foreground">{cat.description}</p>}
      <BlogListingLayout posts={posts.docs} />
      {cat.faqs && cat.faqs.length > 0 && <CategoryFAQ faqs={cat.faqs as Array<{ question: string; answer: string }>} />}
      <CategoryExplore categories={allCategories.docs} currentId={cat.id} />
    </main>
  )
}

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
