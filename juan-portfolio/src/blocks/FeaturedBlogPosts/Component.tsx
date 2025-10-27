'use client'

import React from 'react'
import type { FeaturedBlogPostsBlock } from '@/payload-types'
import Link from 'next/link'
import { Media } from '@/components/Media'
import { getPostUrl } from '@/utilities/getPostUrl'

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

  // Format date to Spanish locale
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  // Calculate read time (assuming ~200 words per minute)
  const calculateReadTime = (content: unknown): number => {
    if (!content) return 5
    const text = JSON.stringify(content)
    const wordCount = text.split(/\s+/).length
    return Math.ceil(wordCount / 200)
  }

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
            const postUrl = getPostUrl(post)
            const heroImage = post.content?.heroImage
            return (
              <div
                key={post.id}
                className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group"
              >
                <Link href={postUrl}>
                  {heroImage && typeof heroImage === 'object' && 'url' in heroImage && (
                    <div className="w-full h-48 overflow-hidden">
                      <Media
                        resource={heroImage}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {post.publishedAt && formatDate(post.publishedAt)} ·{' '}
                      {calculateReadTime(post.content)} min de lectura
                    </p>
                    <h3 className="text-lg font-bold text-current mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    {post.meta?.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                        {post.meta.description}
                      </p>
                    )}
                  </div>
                </Link>
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
