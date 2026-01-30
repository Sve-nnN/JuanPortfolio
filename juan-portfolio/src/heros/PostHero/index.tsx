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
}

export const PostHero: React.FC<{
  post: Post
  excerpt?: string | null
  readingTime?: number | null
  mainCategory?: { title: string; href?: string } | null
}> = ({ post, excerpt = null, readingTime = null, mainCategory = null }) => {
  const { categories: postCategories, content, populatedAuthors, publishedAt, title } = post
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
      const element = slug ? (
        <Link key={a.id || i} href={`/authors/${slug}`} className="font-medium hover:underline">
          {name}
        </Link>
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
          {nodes[0]} and {nodes[1]}
        </>
      )
    return (
      <>
        {nodes.slice(0, -1).map((n, idx) => (
          <React.Fragment key={idx}>{n}, </React.Fragment>
        ))}
        and {nodes[nodes.length - 1]}
      </>
    )
  }

  return (

    <div className="relative min-h-[80vh] flex items-end justify-end pb-12 sm:pb-16 lg:pb-20">
      <div className="container z-10 relative flex flex-col items-end text-right text-white">
        <div className="max-w-4xl w-full flex flex-col items-end gap-6 animate-fade-in-up">

          {/* Categories / Breadcrumbs */}
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex flex-wrap justify-end gap-2 items-center mb-0 text-sm font-medium uppercase tracking-wide text-white/80">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <span className="text-white/40">/</span>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>

            {mainCategory && (
              <>
                <span className="text-white/40">/</span>
                <Link href={mainCategory.href || '/blog'} className="text-primary-foreground bg-primary/20 px-2 py-0.5 rounded text-xs backdrop-blur-md border border-primary/20 hover:bg-primary/30 transition-colors">
                  {mainCategory.title}
                </Link>
              </>
            )}

            {/* Fallback to list if no mainCategory provided */}
            {!mainCategory && categories?.map((category: string | Category, index: number) => {
              if (typeof category === 'object' && category !== null) {
                return (
                  <React.Fragment key={index}>
                    <span className="text-white/40">/</span>
                    <span className="text-primary-foreground bg-primary/20 px-2 py-0.5 rounded text-xs backdrop-blur-md border border-primary/20">
                      {category.title || 'Untitled'}
                    </span>
                  </React.Fragment>
                )
              }
              return null
            })}
          </nav>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight text-white drop-shadow-sm">
            {title}
          </h1>

          {/* Excerpt */}
          {excerpt && (
            <p className="text-lg md:text-xl text-gray-200 leading-relaxed max-w-2xl drop-shadow-sm">
              {excerpt}
            </p>
          )}

          {/* Meta Info Row */}
          <div className="flex flex-wrap justify-end items-center gap-6 text-sm text-gray-300 font-medium tracking-wide mt-4 border-t border-white/20 pt-6 w-full md:w-auto pl-8">

            {/* Author */}
            {hasAuthors && (
              <div className="flex items-center gap-2">
                <span className="text-white/50 uppercase text-xs">Escrito por</span>
                <span className="text-white">{renderAuthors()}</span>
              </div>
            )}

            {/* Date */}
            {publishedAt && (
              <div className="flex items-center gap-2">
                <span className="text-white/50 uppercase text-xs">Publicado</span>
                <time dateTime={publishedAt} className="text-white">
                  {formatDateTime(publishedAt)}
                </time>
              </div>
            )}

            {/* Reading Time */}
            {readingTime && (
              <div className="flex items-center gap-2">
                <span className="text-white/50 uppercase text-xs">Lectura</span>
                <span className="text-white">{readingTime} min</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0 select-none">
        {!heroImage && (
          <img
            src={getFallbackBySlug(post.slug ?? '')}
            alt="Hero Background"
            className="object-cover w-full h-full"
          />
        )}
        {heroImage && typeof heroImage !== 'string' && (
          <Media className="object-cover w-full h-full" resource={heroImage} />
        )}
        {/* Stronger gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/60" />
      </div>
    </div>
  )
}
