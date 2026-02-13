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
    <section className="py-24 md:py-32 overflow-hidden bg-secondary">
      <div className="container mx-auto px-4">
        {title && (
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-4xl md:text-6xl font-array font-bold tracking-tight uppercase opacity-20">
              {title}
            </h2>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border p-8 md:p-16 rounded-[3rem] flex flex-col items-center text-center shadow-2xl relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-4xl font-serif">
              &ldquo;
            </div>
            
            <blockquote className="text-2xl md:text-4xl font-medium mb-12 leading-relaxed italic">
              {quote}
            </blockquote>
            
            <div className="flex flex-col items-center gap-4">
              {authorImage && typeof authorImage === 'object' && authorImage.url && (
                <div className="relative w-20 h-20 rounded-full overflow-hidden ring-4 ring-primary/20 mb-2">
                  <Image 
                    src={authorImage.url} 
                    alt={authorName || 'Author'} 
                    fill 
                    className="object-cover" 
                  />
                </div>
              )}
              <div>
                <div className="text-xl font-bold">{authorName}</div>
                <div className="text-muted-foreground font-medium">{authorRole}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
