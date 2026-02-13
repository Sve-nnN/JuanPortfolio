import React from 'react'
import type { PostArticleHeaderBlock, Category, User, Media as MediaType } from '@/payload-types'
import { Media } from '@/components/Media'
import { Calendar, Clock, User as UserIcon } from 'lucide-react'

export const PostArticleHeader: React.FC<PostArticleHeaderBlock & { locale?: 'en' | 'es' }> = ({
  category,
  title,
  author,
  publishedDate,
  readTime,
  featuredImage,
  locale: _locale
}) => {
  const categoryData = category && typeof category === 'object' ? (category as Category) : null
  const authorData = author && typeof author === 'object' ? (author as User) : null

  return (
    <section className="container mx-auto px-4 pt-16 pb-8">
      <div className="max-w-4xl mx-auto">
        {categoryData && (
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-widest mb-6">
            {categoryData.title}
          </span>
        )}
        
        <h1 className="text-4xl md:text-6xl font-array font-bold mb-8 leading-tight">
          {title}
        </h1>

        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-12 py-6 border-y border-border">
          {authorData && (
            <div className="flex items-center gap-2">
              <UserIcon size={16} className="text-primary" />
              <span className="font-medium text-foreground">{authorData.name}</span>
            </div>
          )}
          
          {publishedDate && (
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>{new Date(publishedDate).toLocaleDateString(_locale === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          )}

          {readTime && (
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>{readTime}</span>
            </div>
          )}
        </div>

        {featuredImage && typeof featuredImage === 'object' && (
          <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl">
            <Media resource={featuredImage as MediaType} fill className="object-cover" />
          </div>
        )}
      </div>
    </section>
  )
}
