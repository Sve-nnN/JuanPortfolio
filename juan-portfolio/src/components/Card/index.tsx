'use client'
import { cn } from '@/utilities/ui'
import useClickableCard from '@/utilities/useClickableCard'
import Link from 'next/link'
import React, { Fragment } from 'react'
import Image from 'next/image'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'
import { getPostUrl } from '@/utilities/getPostUrl'
import { getFallbackBySlug } from '@/constants/fallbackImages'

export type CardPostData = Pick<Post, 'slug' | 'meta' | 'title' | 'categories'> & {
  categories?: Array<{ id: string; title: string } | string> | null
}

export const Card: React.FC<{
  alignItems?: 'center'
  className?: string
  doc?: CardPostData
  relationTo?: 'posts' | 'case-studies'
  showCategories?: boolean
  title?: string
  locale?: 'en' | 'es'
}> = (props) => {
  const { card, link } = useClickableCard({})
  const { className, doc, relationTo, showCategories, title: titleFromProps, locale = 'es' } = props
  const localePrefix = locale === 'es' ? '' : '/en'

  const { slug, categories, meta, title } = doc || {}
  const { description, image: metaImage } = meta || {}

  const hasCategories = categories && Array.isArray(categories) && categories.length > 0
  const titleToUse = titleFromProps || title
  const sanitizedDescription = description?.replace(/\s/g, ' ') // replace non-breaking space with white space

  // Use getPostUrl for posts to get /blog/{category}/{slug} format
  const href = (() => {
    if (!doc) return '#'
    if (relationTo === 'posts') {
      return getPostUrl(doc as Post, locale)
    }
    if (relationTo === 'case-studies') {
      return `${localePrefix}/case-studies/${slug}`
    }
    return `${localePrefix}/${relationTo}/${slug}`
  })()

  return (
    <article
      className={cn(
        'border border-border rounded-xl overflow-hidden bg-card text-card-foreground hover:shadow-lg transition-all duration-300',
        className,
      )}
      ref={card.ref}
    >
      <div className="relative w-full aspect-video overflow-hidden bg-muted">
        {!metaImage && (
          <Image
            src={getFallbackBySlug(slug || '')}
            alt={titleToUse || 'Post Image'}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}
        {metaImage && typeof metaImage !== 'string' && (
          <Media 
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" 
            resource={metaImage} 
            size="33vw" 
          />
        )}
      </div>
      <div className="p-5 flex flex-col gap-3">
        {showCategories && hasCategories && (
          <div className="flex flex-wrap gap-2">
            {categories?.map((category, index) => {
              if (typeof category === 'object' && category !== null) {
                return (
                  <span key={index} className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded">
                    {category.title || 'Category'}
                  </span>
                )
              }
              return null
            })}
          </div>
        )}
        
        {titleToUse && (
          <h3 className="text-xl font-display font-bold leading-tight line-clamp-2">
            <Link className="hover:text-primary transition-colors" href={href} ref={link.ref}>
              {titleToUse}
            </Link>
          </h3>
        )}
        
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {sanitizedDescription}
          </p>
        )}
      </div>
    </article>
  )
}
