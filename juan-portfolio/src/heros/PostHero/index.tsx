'use client'

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

import { motion } from 'framer-motion'

export const PostHero: React.FC<{
  post: Post
  excerpt?: string | null
  readingTime?: number | null
  mainCategory?: { title: string; href?: string } | null
  locale?: 'en' | 'es'
}> = ({ post, excerpt = null, readingTime = null, mainCategory = null, locale = 'es' }) => {
  const { categories: postCategories, content, populatedAuthors, publishedAt, title } = post
  const localePrefix = locale === 'es' ? '' : '/en'
  const categories = postCategories
  const heroImage = content?.heroImage

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  const hasAuthors =
    populatedAuthors && populatedAuthors.length > 0 && formatAuthors(populatedAuthors) !== ''

  const renderAuthors = () => {
    if (!populatedAuthors || populatedAuthors.length === 0) return null

    // Render each author as a link if slug is present
    const nodes = populatedAuthors.map((a, i) => {
      const name = a.name
      const slug = (a as PopulatedAuthor).slug
      const element = slug ? (
        <Link key={a.id || i} href={`${localePrefix}/authors/${slug}`} className="font-medium hover:underline">
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
    <div className="relative min-h-[80vh] flex items-end justify-end pb-12 sm:pb-16 lg:pb-20 overflow-hidden">
      <div className="container z-10 relative flex flex-col items-end text-right text-white">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-4xl w-full flex flex-col items-end gap-4 pt-32 md:pt-40"
        >
          {/* Categories / Breadcrumbs */}
          <motion.nav
            variants={itemVariants}
            aria-label="Breadcrumb"
            className="flex flex-wrap justify-end gap-2 items-center text-sm font-medium uppercase tracking-wide text-white/80"
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
          </motion.nav>

          <motion.h1
            variants={itemVariants}
            className="font-display font-extrabold leading-[1.1] tracking-tighter text-white drop-shadow-xl text-right"
            style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)' }}
          >
            {title}
          </motion.h1>

          {excerpt && (
            <motion.p
              variants={itemVariants}
              className="text-lg md:text-2xl text-white/90 leading-relaxed max-w-2xl drop-shadow-md font-medium"
            >
              {excerpt}
            </motion.p>
          )}

          {/* Meta Info Row */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-end items-center gap-6 text-sm text-white/80 font-medium tracking-wide mt-6 border-t border-white/20 pt-8 w-full md:w-auto"
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
          </motion.div>
        </motion.div>
      </div>

      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0 select-none">
        {!heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getFallbackBySlug(post.slug ?? '')}
            alt="Hero Background"
            className="object-cover w-full h-full"
          />
        )}
        {heroImage && typeof heroImage !== 'string' && (
          <Media className="object-cover w-full h-full" resource={heroImage} priority />
        )}
        {/* Stronger gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/60" />
      </div>
    </div>
  )
}
