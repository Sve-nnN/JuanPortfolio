import React from 'react'
import type { PostsGridBlock, Post, Category } from '@/payload-types'
import { Card } from '@/components/Card'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { AnimateOnScroll } from '@/components/AnimateOnScroll'
import { AnimatedCard } from './AnimatedCard'

// Define PostsGridProps type based on used props
type PostsGridProps = PostsGridBlock & { page?: number; overridePosts?: Post[] }

export const PostsGrid: React.FC<PostsGridProps> = async (props) => {
  const {
    postsPerPage = 12,
    showCategories = true,
    gridColumns = '3',

    page = 1,
    animation,
  } = props

  // Fetch posts
  let posts: Post[] = []
  let totalPages = 1

  if (props.overridePosts) {
    posts = props.overridePosts
  } else {
    try {
      const payload = await getPayload({ config: configPromise })
      const res = await payload.find({
        collection: 'posts',
        limit: postsPerPage || 6,
        page,
        depth: 1,
        sort: '-publishedAt',
      })
      posts = (res.docs as Post[]) || []
      totalPages = res.totalPages
    } catch {
      // Fallback mock
      posts = []
    }
  }

  // Fetch categories if needed
  let categories: Category[] = []
  if (showCategories) {
    try {
      const payload = await getPayload({ config: configPromise })
      const res = await payload.find({
        collection: 'categories',
        limit: 100,
        pagination: false,
      })
      categories = (res.docs as Category[]) || []
    } catch {
      categories = []
    }
  }

  const gridColsClass = {
    '2': 'lg:grid-cols-2',
    '3': 'lg:grid-cols-3',
    '4': 'lg:grid-cols-4',
  }[gridColumns || '3']

  return (
    <AnimateOnScroll config={animation} className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Category Filters */}
      {showCategories && categories.length > 0 && (
        <div className="mb-12 flex flex-wrap justify-center gap-2">
          <button className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-full">
            Todo
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className="px-4 py-2 text-sm font-medium text-muted bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {cat.title}
            </button>
          ))}
        </div>
      )}

      {/* Posts Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-8`}>
        {posts.map((p, i) => (
          <AnimatedCard 
            key={p.id}
            post={p}
            index={i}
            showCategories={Boolean(showCategories)}
          />
        ))}
      </div>

      {/* Pagination (simple display - can be enhanced) */}
      {totalPages > 1 && (
        <div className="mt-12 flex justify-center gap-2">
          <p className="text-muted">
            Página {page} de {totalPages}
          </p>
        </div>
      )}
    </AnimateOnScroll>
  )
}
