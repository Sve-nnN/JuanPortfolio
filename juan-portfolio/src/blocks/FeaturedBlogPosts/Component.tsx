import React from 'react'
import type { FeaturedBlogPostsBlock as FeaturedBlogPostsBlockType } from '@/payload-types'
import { Card } from '@/components/Card'

export const FeaturedBlogPosts: React.FC<FeaturedBlogPostsBlockType & { locale?: 'en' | 'es' }> = (props) => {
  const { title, description, posts, locale = 'es' } = props

  if (!posts || posts.length === 0) return null

  return (
    <section className="py-12 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {(title || description) && (
          <div className="max-w-3xl mb-12">
            {title && <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">{title}</h2>}
            {description && <p className="text-lg text-muted-foreground">{description}</p>}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => {
            if (typeof post === 'string') return null
            return (
              <Card 
                key={post.id} 
                doc={post} 
                relationTo="posts" 
                showCategories={true} 
                locale={locale}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
