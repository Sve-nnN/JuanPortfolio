import React from 'react'
import { Card, CardPostData } from '@/components/Card'
import type { Post } from '@/payload-types'

interface RelatedPostsProps {
  posts: Post[]
  locale?: 'en' | 'es'
}

const RelatedPosts: React.FC<RelatedPostsProps> = ({ posts, locale = 'es' }) => {
  // Use posts directly since they are already filtered by getRelatedPosts
  const related = posts.slice(0, 3)

  if (related.length === 0) return null

  return (
    <section className="mt-24 pt-16 border-t border-border/50">
      <h2 className="text-3xl md:text-5xl font-display font-bold mb-12 tracking-tight text-foreground">
        {locale === 'es' ? 'También te puede interesar' : 'You may also like'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
        {related.map((post) => {
          return <Card key={post.id} doc={post as CardPostData} relationTo="posts" showCategories locale={locale} />
        })}
      </div>
    </section>
  )
}

export default RelatedPosts
