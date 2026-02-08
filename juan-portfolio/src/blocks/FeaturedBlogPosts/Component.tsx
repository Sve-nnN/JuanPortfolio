'use client'

import React from 'react'
import type { FeaturedBlogPostsBlock } from '@/payload-types'
import Link from 'next/link'
import { Card } from '@/components/Card'

export const FeaturedBlogPosts: React.FC<FeaturedBlogPostsBlock> = (props) => {
  const { title, description, posts, ctaText, ctaLink, backgroundColor } = props

  // Get posts list
  const postsList =
    posts && Array.isArray(posts)
      ? posts.map((post) => (typeof post === 'object' ? post : null)).filter(Boolean)
      : []

  // Background color classes
  const bgColorClass =
    backgroundColor === 'gray'
      ? 'bg-gray-50 dark:bg-card'
      : backgroundColor === 'primary'
        ? 'bg-primary/5'
        : 'bg-background'

  return (
    <section className={`py-20 md:py-28 ${bgColorClass}`} id="blog">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-current">{title}</h2>
          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">{description}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {postsList.map((post) => {
            if (!post) return null
            return (
              <div key={post.id} className="h-full">
                <Card
                  className="h-full"
                  doc={post}
                  relationTo="posts"
                  showCategories={false}
                />
              </div>
            )
          })}
        </div>
        {ctaText && ctaLink && (
          <div className="text-center mt-12">
            <Link
              className="bg-primary text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors inline-block"
              href={ctaLink}
            >
              {ctaText}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
