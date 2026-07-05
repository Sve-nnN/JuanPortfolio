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
    <section className="container mx-auto px-4 pt-20 pb-12">
      <div className="max-w-5xl mx-auto">
        {categoryData && (
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-bold rounded-full uppercase tracking-[0.2em] mb-10">
            {categoryData.title}
          </span>
        )}
        
        <h1 className="text-display font-display font-bold mb-12 leading-[1.05] tracking-tighter text-foreground">
          {title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-10 gap-y-6 text-base md:text-lg text-muted-foreground mb-16 py-8 border-y border-border/50 font-medium">
          {authorData && (
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <UserIcon size={20} className="text-primary" />
              </div>
              <span className="font-bold text-foreground">{authorData.name}</span>
            </div>
          )}
          
          {publishedDate && (
            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-primary/60" />
              <span>{new Date(publishedDate).toLocaleDateString(_locale === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          )}

          {readTime && (
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-primary/60" />
              <span>{readTime}</span>
            </div>
          )}
        </div>

        {featuredImage && typeof featuredImage === 'object' && (
          <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl border border-border/50">
            <Media resource={featuredImage as MediaType} fill className="object-cover transition-transform duration-1000 hover:scale-105" />
          </div>
        )}
      </div>
    </section>
  )
}
