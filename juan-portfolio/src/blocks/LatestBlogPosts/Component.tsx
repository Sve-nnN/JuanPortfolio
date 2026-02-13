import React from 'react'
import type { LatestBlogPostsBlock as LatestBlogPostsBlockType, Post } from '@/payload-types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { ArrowRight } from 'lucide-react'

export const LatestBlogPostsBlock: React.FC<LatestBlogPostsBlockType & { locale?: 'en' | 'es' }> = async ({
  title,
  count = 3,
  locale = 'es',
}) => {
  const displayTitle = title || (locale === 'es' ? 'Últimos posts del blog' : 'Latest blog posts')
  let posts: Post[] = []
  try {
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'posts',
      limit: count || 3,
      sort: '-publishedAt',
      depth: 2,
      locale,
      where: {
        _status: {
          equals: 'published',
        },
      },
    })
    posts = (res.docs as Post[]) || []
  } catch {
    posts = []
  }

  const localePrefix = locale === 'es' ? '' : '/en'

  return (
    <section className="py-24 md:py-32 bg-secondary" id="latest-blog-posts">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground leading-tight">
              {displayTitle}
            </h2>
          </div>
          <Link
            href={`${localePrefix}/blog`}
            className="hidden md:inline-flex items-center text-lg font-medium text-foreground hover:text-primary transition-colors group"
          >
            {locale === 'es' ? 'Ver todos los artículos' : 'View all articles'}
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {posts.map((post) => {
              return (
                <div key={post.id} className="h-full">
                  <Card
                    className="h-full"
                    doc={post}
                    relationTo="posts"
                    showCategories={false}
                    locale={locale}
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-2xl">
            <p className="text-muted-foreground text-lg">
              {locale === 'es' ? 'No se encontraron artículos publicados recientemente.' : 'No recently published articles found.'}
            </p>
          </div>
        )}

        <div className="mt-12 md:hidden text-center">
          <Link
            href={`${localePrefix}/blog`}
            className="inline-flex items-center text-lg font-medium text-foreground hover:text-primary transition-colors group"
          >
            {locale === 'es' ? 'Ver todos los artículos' : 'View all articles'}
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default LatestBlogPostsBlock
