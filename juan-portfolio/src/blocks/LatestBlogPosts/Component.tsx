import React from 'react'
import type { LatestBlogPostsBlock, Post } from '@/payload-types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { Media } from '@/components/Media'

export const LatestBlogPostsBlock: React.FC<LatestBlogPostsBlock> = async ({
  title = 'Últimos posts del blog',
  count = 3,
}) => {
  let posts: Post[] = []
  try {
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'posts',
      limit: count,
      sort: '-publishedAt',
      depth: 1,
    })
    posts = (res.docs as Post[]) || []
  } catch {
    posts = []
  }

  if (!posts.length) return null

  // Formato de fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  // Calcular tiempo de lectura (aprox. 200 palabras/min)
  const calculateReadTime = (content: any): number => {
    if (!content) return 5
    const text = JSON.stringify(content)
    const wordCount = text.split(/\s+/).length
    return Math.ceil(wordCount / 200)
  }

  return (
    <section className="py-20 md:py-28" id="latest-blog-posts">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-current">{title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group"
            >
              <Link href={`/blog/${post.slug}`}>
                {post.heroImage && (
                  <div className="w-full h-48 overflow-hidden">
                    <Media
                      resource={post.heroImage}
                      className="w-full h-full object-cover"
                      imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
          ))}
        </div>
      </div>
    </section>
  )
}

export default LatestBlogPostsBlock
