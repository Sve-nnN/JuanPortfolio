import { formatDateTime } from 'src/utilities/formatDateTime'
import React from 'react'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'
import { formatAuthors } from '@/utilities/formatAuthors'
import Link from 'next/link'

export const PostHero: React.FC<{
  post: Post
  excerpt?: string | null
  readingTime?: number | null
}> = ({ post, excerpt = null, readingTime = null }) => {
  const { categories, heroImage, populatedAuthors, publishedAt, title } = post

  const hasAuthors =
    populatedAuthors && populatedAuthors.length > 0 && formatAuthors(populatedAuthors) !== ''

  const renderAuthors = () => {
    if (!populatedAuthors || populatedAuthors.length === 0) return null

    // Render each author as a link if slug is present
    const nodes = populatedAuthors.map((a, i) => {
      const name = a.name
      const slug = (a as any).slug
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
    <div className="relative flex items-end pt-8">
      <div className="container z-10 relative lg:grid lg:grid-cols-[1fr_48rem_1fr] text-white pb-8">
        <div className="col-start-1 col-span-1 md:col-start-2 md:col-span-2">
          <div className="mb-4 flex flex-wrap gap-2">
            {categories?.map((category, index) => {
              if (typeof category === 'object' && category !== null) {
                const { title: categoryTitle } = category

                const titleToUse = categoryTitle || 'Untitled category'

                return (
                  <span
                    key={index}
                    className="inline-block bg-primary/10 text-primary text-xs sm:text-sm font-semibold mr-2 px-3 py-1 rounded-full border border-primary/20"
                  >
                    {titleToUse}
                  </span>
                )
              }
              return null
            })}
          </div>

          <div className="">
            <h1 className="mb-4 text-3xl md:text-5xl lg:text-6xl font-display leading-tight max-w-3xl">
              {title}
            </h1>
            {excerpt && <p className="lead text-white/90 mb-4 max-w-2xl">{excerpt}</p>}
          </div>

          <div className="mt-2 flex flex-col md:flex-row gap-6 md:gap-12 items-start text-sm text-white/80">
            <div className="flex items-center gap-4">
              {hasAuthors && (
                <div className="text-sm">
                  <span className="block text-xs text-white/60 uppercase tracking-wider">
                    Autor
                  </span>
                  <span className="font-medium inline">{renderAuthors()}</span>
                </div>
              )}
              {publishedAt && (
                <div className="text-sm">
                  <span className="block text-xs text-white/60 uppercase tracking-wider">
                    Fecha
                  </span>
                  <time className="font-medium" dateTime={publishedAt}>
                    {formatDateTime(publishedAt)}
                  </time>
                </div>
              )}
              {readingTime && (
                <div className="text-sm">
                  <span className="block text-xs text-white/60 uppercase tracking-wider">
                    Lectura
                  </span>
                  <span className="font-medium">{readingTime} min</span>
                </div>
              )}
            </div>
            {/* excerpt already shown under the H1; avoid duplicate rendering here */}
          </div>
        </div>
      </div>
      <div className="min-h-[60vh] select-none w-full">
        {heroImage && typeof heroImage !== 'string' && (
          <Media fill priority imgClassName="-z-10 object-cover" resource={heroImage} />
        )}
        <div className="absolute pointer-events-none left-0 bottom-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent" />
      </div>
    </div>
  )
}
