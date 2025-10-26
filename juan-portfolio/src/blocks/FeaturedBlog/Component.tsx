import React from 'react'
import Image from 'next/image'
import type { FeaturedBlogBlock, Post } from '@/payload-types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const FeaturedBlogBlock: React.FC<FeaturedBlogBlock> = async (props) => {
  const { title, description, posts, limit = 3, ctaLabel, ctaUrl } = props

  let displayPosts: Post[] = []

  // If specific posts are selected, use them
  if (posts && Array.isArray(posts) && posts.length > 0) {
    displayPosts = posts.filter((p) => typeof p === 'object').slice(0, limit) as Post[]
  } else {
    // Otherwise, fetch the latest posts
    try {
      const payload = await getPayload({ config: configPromise })
      const res = await payload.find({
        collection: 'posts',
        limit,
        pagination: false,
        sort: '-publishedAt',
      })
      displayPosts = (res.docs as Post[]) || []
    } catch {
      // Fallback if Payload is not available
      displayPosts = []
    }
  }

  return (
    <section id="blog" className="py-20 md:py-28 bg-gray-50 dark:bg-card-dark">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {(title || description) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="text-3xl md:text-4xl font-display font-bold text-current">{title}</h2>
            )}
            {description && <p className="mt-4 text-lg text-muted">{description}</p>}
          </div>
        )}

        {/* Posts Grid */}
        {displayPosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayPosts.map((p) => {
              const heroUrl =
                p.heroImage && typeof p.heroImage === 'object' && 'url' in p.heroImage
                  ? p.heroImage.url
                  : null

              const heroAlt =
                p.heroImage && typeof p.heroImage === 'object' && 'alt' in p.heroImage
                  ? p.heroImage.alt
                  : p.title || ''

              return (
                <div
                  key={p.id}
                  className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group"
                >
                  <a href={`/blog/${p.slug}`}>
                    {heroUrl && (
                      <div className="relative w-full h-48">
                        <Image
                          src={heroUrl}
                          alt={heroAlt || ''}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      {p.publishedAt && (
                        <p className="text-sm text-muted mb-2">
                          {new Date(p.publishedAt).toLocaleDateString()}
                        </p>
                      )}
                      <h3 className="text-lg font-bold text-current mb-2 group-hover:text-primary transition-colors">
                        {p.title}
                      </h3>
                      {p.meta?.description && (
                        <p className="text-muted text-sm">{p.meta.description}</p>
                      )}
                    </div>
                  </a>
                </div>
              )
            })}
          </div>
        )}

        {/* CTA Button */}
        {ctaLabel && ctaUrl && (
          <div className="text-center mt-12">
            <a
              className="bg-primary text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors inline-block"
              href={ctaUrl}
            >
              {ctaLabel}
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
