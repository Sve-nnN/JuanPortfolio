import React from 'react'
import type { LatestBlogPostsBlock as LatestBlogPostsBlockType, Post } from '@/payload-types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { Media } from '@/components/Media'
import { getPostUrl } from '@/utilities/getPostUrl'
import { ArrowRight } from 'lucide-react'

export const LatestBlogPostsBlock: React.FC<LatestBlogPostsBlockType> = async ({
  title = 'Últimos posts del blog',
  count = 3,
}) => {
  let posts: Post[] = []
  try {
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'posts',
      limit: count || 3,
      sort: '-publishedAt',
      depth: 2,
    })
    posts = (res.docs as Post[]) || []
  } catch {
    posts = []
  }

  // if (!posts.length) return null

  // Formato de fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  // Calcular tiempo de lectura (aprox. 200 palabras/min)
  const calculateReadTime = (content: unknown): number => {
    if (!content) return 5
    const text = JSON.stringify(content)
    const wordCount = text.split(/\s+/).length
    return Math.ceil(wordCount / 200)
  }

  return (
    <section className="py-24 md:py-32 bg-secondary" id="latest-blog-posts">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground leading-tight">
              {title}
            </h2>
          </div>
          <Link
            href="/posts"
            className="hidden md:inline-flex items-center text-lg font-medium text-foreground hover:text-primary transition-colors group"
          >
            Ver todos los artículos
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {posts.map((post) => {
              const heroImage = post.content?.heroImage
              const postUrl = getPostUrl(post)

              return (
                <div key={post.id} className="group flex flex-col h-full bg-card rounded-2xl p-5 border border-border/40 hover:border-border transition-colors shadow-sm hover:shadow-md">
                  <Link href={postUrl} className="block overflow-hidden rounded-xl mb-6 relative aspect-video bg-muted">
                    {heroImage && (
                      <Media
                        resource={heroImage}
                        fill
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    )}
                  </Link>

                  <div className="flex flex-col flex-grow">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide">
                        Blog
                      </span>
                      <span>{post.publishedAt && formatDate(post.publishedAt)}</span>
                      <span>·</span>
                      <span>{calculateReadTime(post.content)} min</span>
                    </div>

                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3 leading-snug group-hover:text-primary transition-colors">
                      <Link href={postUrl}>{post.title}</Link>
                    </h3>

                    {post.meta?.description && (
                      <p className="text-muted-foreground mb-6 line-clamp-2 leading-relaxed">
                        {post.meta.description}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-2xl">
            <p className="text-muted-foreground text-lg">No se encontraron artículos publicados recientemente.</p>
          </div>
        )}

        <div className="mt-12 md:hidden text-center">
          <Link
            href="/posts"
            className="inline-flex items-center text-lg font-medium text-foreground hover:text-primary transition-colors group"
          >
            Ver todos los artículos
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default LatestBlogPostsBlock
