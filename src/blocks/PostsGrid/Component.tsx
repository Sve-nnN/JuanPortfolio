import React from 'react'
import type { PostsGridBlock, Post, Category } from '@/payload-types'
import { Card } from '@/components/Card'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { AnimateOnScroll } from '@/components/AnimateOnScroll'
import { AnimatedCard } from './AnimatedCard'

// Define PostsGridProps type based on used props
type PostsGridProps = PostsGridBlock & { 
  page?: number; 
  overridePosts?: Post[]; 
  locale?: 'en' | 'es' 
}

export const PostsGrid: React.FC<PostsGridProps> = async (props) => {
  const {
    postsPerPage = 12,
    showCategories = true,
    gridColumns = '3',

    page = 1,
    animation,
    locale = 'es',
  } = props

  // Fetch posts and categories in parallel
  let posts: Post[] = []
  let totalPages = 1
  let categories: Category[] = []

  if (props.overridePosts) {
    posts = props.overridePosts
  } else {
    try {
      const payload = await getPayload({ config: configPromise })

      // Run both queries in parallel
      const [postsRes, categoriesRes] = await Promise.all([
        payload.find({
          collection: 'posts',
          limit: postsPerPage || 6,
          page,
          depth: 1,
          sort: '-publishedAt',
          locale,
          where: {
            _status: {
              equals: 'published',
            },
          },
        }),
        showCategories
          ? payload.find({
              collection: 'categories',
              limit: 100,
              pagination: false,
              locale,
            })
          : Promise.resolve(null),
      ])

      posts = (postsRes.docs as Post[]) || []
      totalPages = postsRes.totalPages

      if (categoriesRes) {
        categories = (categoriesRes.docs as Category[]) || []
      }
    } catch {
      // Fallback
      posts = []
      categories = []
    }
  }

  const gridColsClass = {
    '2': 'lg:grid-cols-2',
    '3': 'lg:grid-cols-3',
    '4': 'lg:grid-cols-4',
  }[gridColumns || '3']

  return (
    <AnimateOnScroll config={animation} className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      {/* Category Filters */}
      {showCategories && categories.length > 0 && (
        <div className="mb-12 flex flex-wrap justify-center gap-3">
          <button className="btn btn-sm btn-primary">
            {locale === 'es' ? 'Todo' : 'All'}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className="btn btn-sm btn-secondary"
            >
              {cat.title}
            </button>
          ))}
        </div>
      )}

      {/* Posts Grid */}
      {posts.length > 0 ? (
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-10 lg:gap-12`}>
          {posts.map((p, i) => (
            <AnimatedCard 
              key={p.id}
              post={p}
              index={i}
              showCategories={Boolean(showCategories)}
              locale={locale}
            />
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center h-48">
          <p className="text-xl text-muted-foreground font-medium">
            {locale === 'es' ? 'No se encontraron posts.' : 'No posts found.'}
          </p>
        </div>
      )}

      {/* Pagination (simple display - can be enhanced) */}
      {totalPages > 1 && (
        <div className="mt-12 flex justify-center gap-2">
          <p className="text-muted">
            {locale === 'es' ? `Página ${page} de ${totalPages}` : `Page ${page} of ${totalPages}`}
          </p>
        </div>
      )}
    </AnimateOnScroll>
  )
}
