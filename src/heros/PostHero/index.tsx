import { formatDateTime } from 'src/utilities/formatDateTime'
import React from 'react'

import type { Post, Category } from '@/payload-types'

import { Media } from '@/components/Media'
import { formatAuthors } from '@/utilities/formatAuthors'
import Link from 'next/link'
import { getFallbackBySlug } from '@/constants/fallbackImages'

interface PopulatedAuthor {
  id?: string | null
  name?: string | null
  slug?: string
  jobTitle?: string | null
}

export const PostHero: React.FC<{
  post: Post
  excerpt?: string | null
  readingTime?: number | null
  mainCategory?: { title: string; href?: string } | null
  locale?: 'en' | 'es'
}> = ({ post, excerpt = null, readingTime = null, mainCategory = null, locale = 'es' }) => {
  const { categories: postCategories, content, populatedAuthors, publishedAt, title } = post
  // Guarantee a non-empty <h1>: some posts (e.g. a locale variant synced without
  // a title) would otherwise render an empty heading, which Ahrefs flags as
  // "H1 missing". Fall back to the SEO meta title, then a humanized slug. META-02.
  const headingTitle =
    title ||
    (post as { meta?: { title?: string } }).meta?.title ||
    (post.slug ? post.slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '')
  const localePrefix = locale === 'es' ? '' : '/en'
  const categories = postCategories
  const heroImage = content?.heroImage

  const hasAuthors =
    populatedAuthors && populatedAuthors.length > 0 && formatAuthors(populatedAuthors) !== ''

  const renderAuthors = () => {
    if (!populatedAuthors || populatedAuthors.length === 0) return null

    // Render each author as a link if slug is present
    const nodes = populatedAuthors.map((a, i) => {
      const name = a.name
      const slug = (a as PopulatedAuthor).slug
      const jobTitle = (a as PopulatedAuthor).jobTitle

      const element = slug ? (
        <div key={a.id || i} className="flex flex-col items-end">
          <Link
            href={`${localePrefix}/authors/${slug}`}
            className="font-semibold hover:underline"
          >
            {name}
          </Link>
          {jobTitle && <span className="text-[10px] opacity-60 font-normal leading-tight">{jobTitle}</span>}
        </div>
      ) : (
        <span key={a.id || i} className="font-medium">
          {name}
        </span>
      )

      return element
    })

    // Join with commas and an 'and' before the last author
    if (nodes.length === 1) return nodes[0]
    if (nodes.length === 2)
      return (
        <>
          {nodes[0]} {locale === 'es' ? 'y' : 'and'} {nodes[1]}
        </>
      )
    return (
      <>
        {nodes.slice(0, -1).map((n, idx) => (
          <React.Fragment key={idx}>{n}, </React.Fragment>
        ))}
        {locale === 'es' ? 'y' : 'and'} {nodes[nodes.length - 1]}
      </>
    )
  }

  return (
    <section className="relative min-h-[80vh] flex items-end justify-end pb-12 sm:pb-16 lg:pb-20 overflow-hidden">
      <div className="container z-10 relative flex flex-col items-end text-right text-white">
        <div
          className="max-w-4xl w-full flex flex-col items-end gap-4 pt-32 md:pt-40"
        >
          {/* Categories / Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap justify-end gap-2 items-center text-sm font-medium uppercase tracking-wide text-white/80 animate-fade-in-up"
          >
            <Link href={localePrefix || '/'} className="hover:text-white transition-colors text-xs opacity-70">
              {locale === 'es' ? 'Inicio' : 'Home'}
            </Link>
            <span className="text-white/40 text-xs">/</span>
            <Link href={`${localePrefix}/blog`} className="hover:text-white transition-colors text-xs opacity-70">
              Blog
            </Link>

            {mainCategory && (
              <>
                <span className="text-white/40 text-xs">/</span>
                <Link
                  href={mainCategory.href ? `${localePrefix}${mainCategory.href}` : `${localePrefix}/blog`}
                  className="text-primary-foreground bg-primary/20 px-2 py-0.5 rounded text-[10px] backdrop-blur-md border border-primary/20 hover:bg-primary/30 transition-colors"
                >
                  {mainCategory.title}
                </Link>
              </>
            )}

            {!mainCategory &&
              categories?.map((category: string | Category, index: number) => {
                if (typeof category === 'object' && category !== null) {
                  return (
                    <React.Fragment key={index}>
                      <span className="text-white/40 text-xs">/</span>
                      <span className="text-primary-foreground bg-primary/20 px-2 py-0.5 rounded text-[10px] backdrop-blur-md border border-primary/20">
                        {category.title || 'Untitled'}
                      </span>
                    </React.Fragment>
                  )
                }
                return null
              })}
          </nav>

          <h1
            className="font-extrabold leading-[1.1] tracking-tighter text-white text-right text-5xl md:text-7xl lg:text-8xl"
            style={{ 
              fontFamily: 'var(--font-array), serif',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)' // Lighter alternative to drop-shadow-xl
            }}
          >
            {headingTitle}
          </h1>

          {(post.content?.tldr || excerpt) && (
            <p
              className="text-lg md:text-2xl text-white/90 leading-relaxed max-w-2xl drop-shadow-md font-medium animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              {post.content?.tldr || excerpt}
            </p>
          )}

          {/* Meta Info Row */}
          <div
            className="flex flex-wrap justify-end items-center gap-6 text-sm text-white/80 font-medium tracking-wide mt-6 border-t border-white/20 pt-8 w-full md:w-auto animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            {hasAuthors && (
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                <span className="text-white/50 uppercase text-[10px] tracking-widest font-bold">
                  {locale === 'es' ? 'Autor' : 'Author'}
                </span>
                <span className="text-white">{renderAuthors()}</span>
              </div>
            )}

            {publishedAt && (
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                <span className="text-white/50 uppercase text-[10px] tracking-widest font-bold">
                  {locale === 'es' ? 'Fecha' : 'Date'}
                </span>
                <time dateTime={publishedAt} className="text-white">
                  {formatDateTime(publishedAt, locale)}
                </time>
              </div>
            )}

            {readingTime && (
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                <span className="text-white/50 uppercase text-[10px] tracking-widest font-bold">
                  {locale === 'es' ? 'Tiempo' : 'Reading Time'}
                </span>
                <span className="text-white">{readingTime} min</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0 select-none">
        {!heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getFallbackBySlug(post.slug ?? '')}
            alt="Hero Background"
            className="object-cover w-full h-full"
            width={1200}
            height={630}
            decoding="async"
            fetchPriority="high"
            loading="eager"
          />
        )}
        {heroImage && typeof heroImage !== 'string' && (
          <Media 
            className="object-cover w-full h-full" 
            resource={heroImage} 
            priority 
            imgClassName="object-cover w-full h-full"
          />
        )}
        {/* Stronger gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/60" />
      </div>
    </section>
  )
}
