import React from 'react'
import type { RelatedPostsBlockType, Post } from '@/payload-types'
import { Card } from '@/components/Card'

export const RelatedPostsBlockComponent: React.FC<RelatedPostsBlockType & { locale?: 'en' | 'es' }> = (props) => {
  const { title, posts, locale = 'es' } = props

  if (!posts || posts.length === 0) return null

  return (
    <div className="related-posts mt-16 pt-16 border-t border-border">
      {title && <h2 className="text-section font-display font-bold mb-8">{title}</h2>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {posts.map((post) => {
          if (typeof post === 'string') return null
          return (
            <Card 
              key={post.id} 
              doc={post as Post} 
              relationTo="posts" 
              showCategories={true} 
              locale={locale}
            />
          )
        })}
      </div>
    </div>
  )
}
