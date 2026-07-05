import React from 'react'
import type { FeaturedBlogBlock, Post } from '@/payload-types'
import { Media } from '@/components/Media'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getPostUrl } from '@/utilities/getPostUrl'
import { getFallbackBySlug } from '@/constants/fallbackImages'
import Link from 'next/link'

export const FeaturedBlog: React.FC<FeaturedBlogBlock & { locale?: 'en' | 'es' }> = async (props) => {
  const { title, description, posts, limit = 3, ctaLabel, ctaUrl, locale = 'es' } = props

  let displayPosts: Post[] = []

  // If specific posts are selected, use them
  if (posts && Array.isArray(posts) && posts.length > 0) {
    displayPosts = posts.filter((p) => typeof p === 'object').slice(0, limit || 3) as Post[]
  } else {
    // Otherwise, fetch the latest posts
    try {
      const payload = await getPayload({ config: configPromise })
      const res = await payload.find({
        collection: 'posts',
        limit: limit || 3,
        pagination: false,
        sort: '-publishedAt',
        locale,
      })
      displayPosts = (res.docs as Post[]) || []
    } catch {
      // Fallback if Payload is not available
      displayPosts = []
    }
  }

  const localePrefix = locale === 'es' ? '' : '/en'

  return (
    <section id="blog" className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {(title || description) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="text-section font-display font-bold text-foreground leading-[1.1] tracking-tight">{title}</h2>
            )}
            {description && <p className="mt-6 text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed max-w-3xl mx-auto">{description}</p>}
          </div>
        )}

        {/* Posts Grid */}
        {displayPosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">
            {displayPosts.map((p) => {
              const href = getPostUrl(p, locale)

              return (
                <div
                  key={p.id}
                  className="card-elevated overflow-hidden border-t-[6px] border-t-primary/10 group cursor-pointer"
                >
                  <Link href={href}>
                    <div className="relative w-full h-56 overflow-hidden">
                      {p.content?.heroImage && typeof p.content.heroImage === 'object' ? (
                        <Media
                          resource={p.content.heroImage}
                          fill
                          imgClassName="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                          htmlElement={null}
                        />
                      ) : (
                        // No hero set: deterministic Cloudinary fallback by slug,
                        // consistent with PostHero/OG. SEO audit jun-2026, #44.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getFallbackBySlug(p.slug ?? '')}
                          alt={p.title || ''}
                          className="object-cover w-full h-full transition-transform duration-1000 ease-out group-hover:scale-110"
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500" />
                    </div>
                    <div className="p-8">
                      {p.publishedAt && (
                        <div className="text-xs text-primary font-bold uppercase tracking-widest mb-4 bg-primary/10 w-fit px-2.5 py-1 rounded-full">
                          {new Date(p.publishedAt).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long' })}
                        </div>
                      )}
                      <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                        {p.title}
                      </h3>
                      {p.meta?.description && (
                        <p className="text-base text-muted-foreground line-clamp-3 leading-relaxed font-medium">{p.meta.description}</p>
                      )}
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        )}

        {/* CTA Button */}
        {ctaLabel && ctaUrl && (
          <div className="text-center mt-12">
            <Link
              className="btn btn-primary"
              href={`${localePrefix}${ctaUrl.startsWith('/') ? '' : '/'}${ctaUrl}`}
            >
              {ctaLabel}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
