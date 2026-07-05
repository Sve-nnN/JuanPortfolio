import React from 'react'
import type { TestimonialSectionBlock } from '@/payload-types'
import Image from 'next/image'

export const TestimonialSection: React.FC<TestimonialSectionBlock & { locale?: 'en' | 'es' }> = ({
  title,
  quote,
  authorName,
  authorRole,
  authorImage,
  locale: _locale = 'es'
}) => {
  return (
    <section className="py-16 md:py-20 overflow-hidden bg-secondary">
      <div className="container mx-auto px-4">
        {title && (
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-section font-array font-bold tracking-tight uppercase opacity-20">
              {title}
            </h2>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <div className="card-elevated p-10 md:p-20 flex flex-col items-center text-center relative group cursor-default border-t-4 border-t-primary/20">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-5xl font-serif shadow-xl border-4 border-background">
              &ldquo;
            </div>
            
            <blockquote className="text-3xl md:text-5xl font-medium mb-10 leading-tight tracking-tight italic text-foreground">
              {quote}
            </blockquote>
            
            <div className="flex flex-col items-center gap-6">
              {authorImage && typeof authorImage === 'object' && authorImage.url && (
                <div className="relative w-24 h-24 rounded-full overflow-hidden ring-8 ring-primary/10 mb-2 shadow-inner">
                  <Image
                    src={authorImage.url}
                    alt={authorName || 'Author'}
                    fill
                    className="object-cover"
                    unoptimized={/\.(avif|webp)$/i.test(authorImage.url as string)}
                  />
                </div>
              )}
              <div>
                <div className="text-2xl font-bold text-foreground">{authorName}</div>
                <div className="text-lg text-muted-foreground font-semibold uppercase tracking-widest">{authorRole}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
