import React from 'react'
import type { PostsGridBlock, Post, Category } from '@/payload-types'
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
        locale,
        where: {
          _status: {
            equals: 'published',
          },
        },
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
        locale,
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
    <AnimateOnScroll config={animation} className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
      {/* Category Filters */}
      {showCategories && categories.length > 0 && (
        <div className="mb-20 flex flex-wrap justify-center gap-3">
          <button className="px-6 py-2.5 text-lg font-bold text-white bg-primary rounded-full shadow-lg shadow-primary/20 transition-all hover:shadow-xl active:scale-95">
            {locale === 'es' ? 'Todo' : 'All'}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className="px-6 py-2.5 text-lg font-bold text-muted-foreground bg-secondary/50 rounded-full border border-border/50 hover:bg-secondary hover:text-foreground transition-all active:scale-95"
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
