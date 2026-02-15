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
    <section className="py-24 md:py-32 bg-background" id="latest-blog-posts">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="max-w-3xl">
            <h2 className="text-5xl md:text-7xl font-display font-bold text-foreground leading-[1.1] tracking-tight">
              {displayTitle}
            </h2>
          </div>
          <Link
            href={`${localePrefix}/blog`}
            className="hidden md:inline-flex items-center text-xl font-bold text-foreground hover:text-primary transition-all group border-b-4 border-primary/20 hover:border-primary pb-2"
          >
            {locale === 'es' ? 'Ver todos los artículos' : 'View all articles'}
            <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
            {posts.map((post) => {
              return (
                <div key={post.id} className="h-full">
                  <Card
                    className="h-full"
                    doc={post}
                    relationTo="posts"
                    showCategories={true}
                    locale={locale}
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-card rounded-[2rem] border border-border/50 shadow-inner">
            <p className="text-muted-foreground text-xl font-medium leading-relaxed">
              {locale === 'es' ? 'No se encontraron artículos publicados recientemente.' : 'No recently published articles found.'}
            </p>
          </div>
        )}

        <div className="mt-16 md:hidden text-center">
          <Link
            href={`${localePrefix}/blog`}
            className="inline-flex items-center text-lg font-bold text-foreground hover:text-primary transition-all group border-b-2 border-primary/20 hover:border-primary pb-1"
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
