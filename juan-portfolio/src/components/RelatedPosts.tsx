import React from 'react'
import { Card, CardPostData } from '@/components/Card'
import type { Post, Category } from '@/payload-types'

interface RelatedPostsProps {
  currentPostId: string | number
  categoryId: string | number
  posts: Post[]
}

const RelatedPosts: React.FC<RelatedPostsProps> = ({ currentPostId, categoryId, posts }) => {
  // Filtrar posts de la misma categoría, omitiendo el actual
  const related = posts
    .filter(
      (post) =>
        post.id !== currentPostId &&
        post.meta_extras?.categories?.some((cat: string | Category) => {
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
      <h2 className="text-2xl font-bold mb-6">Posts relacionados</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {related.map((post) => {
          // Aseguramos que Card recibe solo las props requeridas
          const cardData: CardPostData = {
            slug: post.slug ?? '',
            categories: post.meta_extras?.categories ?? [],
            meta: post.meta ?? {},
            title: post.title ?? '',
          }
          return <Card key={post.id} doc={cardData} relationTo="posts" showCategories />
        })}
      </div>
    </section>
  )
}

export default RelatedPosts
