import React from 'react'
import type { TestimonialsCarouselBlock, Testimonial } from '@/payload-types'
import Image from 'next/image'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const TestimonialsCarousel: React.FC<TestimonialsCarouselBlock & { locale?: 'en' | 'es' }> = async ({
  title,
  limit,
  locale: _locale
}) => {
  let testimonials: Testimonial[] = []
  
  try {
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'testimonials',
      limit: limit || 8,
      sort: '-createdAt',
    })
    testimonials = res.docs || []
  } catch (error) {
    console.error('Error fetching testimonials:', error)
  }

  if (testimonials.length === 0) return null

  return (
    <section className="py-24 md:py-32 bg-primary/5">
      <div className="container mx-auto px-4">
        {title && <h2 className="text-4xl md:text-6xl font-array font-bold text-center mb-20 tracking-tighter">{title}</h2>}
        
        <div className="flex flex-wrap justify-center gap-8">
          {testimonials.map((t, i) => {
            return (
              <div key={i} className="max-w-md p-8 bg-card border border-border rounded-3xl shadow-xl">
                <div className="text-2xl italic mb-8">&ldquo;{t.testimonial}&rdquo;</div>
                <div className="flex items-center gap-4">
                  {t.avatar && typeof t.avatar === 'object' && t.avatar.url && (
                    <Image src={t.avatar.url} alt={t.author || ''} width={48} height={48} className="rounded-full ring-2 ring-primary/20" />
                  )}
                  <div>
                    <div className="font-bold">{t.author}</div>
                    <div className="text-sm text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
