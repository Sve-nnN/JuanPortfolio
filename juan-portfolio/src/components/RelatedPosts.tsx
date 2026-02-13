import React from 'react'
import { Card, CardPostData } from '@/components/Card'
import type { Post, Category } from '@/payload-types'

interface RelatedPostsProps {
  currentPostId: string | number
  categoryId: string | number
  posts: Post[]
  locale?: 'en' | 'es'
}

const RelatedPosts: React.FC<RelatedPostsProps> = ({ currentPostId, categoryId, posts, locale = 'es' }) => {
  // Filtrar posts de la misma categoría, omitiendo el actual
  const related = posts
    .filter(
      (post) =>
        post.id !== currentPostId &&
        post.categories?.some((cat: string | Category) => {
          if (!cat) return false
          if (typeof cat === 'string') return cat === categoryId
          return cat.id === categoryId
        }),
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)

  if (related.length === 0) return null

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold mb-6">
        {locale === 'es' ? 'Posts relacionados' : 'Related posts'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {related.map((post) => {
          // Aseguramos que Card recibe solo las props requeridas
          const cardData: CardPostData = {
            slug: post.slug ?? '',
            categories: post.categories ?? [],
            meta: post.meta ?? {},
            title: post.title ?? '',
          }
          return <Card key={post.id} doc={cardData} relationTo="posts" showCategories locale={locale} />
        })}
      </div>
    </section>
  )
}

export default RelatedPosts
