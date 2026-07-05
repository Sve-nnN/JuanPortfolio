import React from 'react'
import type { TestimonialsCarouselBlock, Testimonial } from '@/payload-types'
import { Media } from '@/components/Media'
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
    <section className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4 text-center">
        {title && <h2 className="text-section font-display font-bold text-center mb-14 tracking-tighter leading-tight">{title}</h2>}
        
        <div className="flex flex-wrap justify-center gap-10 lg:gap-12">
          {testimonials.map((t, i) => {
            return (
              <div key={i} className="card-elevated max-w-md p-10 text-left group cursor-default border-t-[6px] border-t-primary/10">
                <div className="text-2xl md:text-3xl italic mb-10 leading-tight tracking-tight text-foreground font-medium">&ldquo;{t.testimonial}&rdquo;</div>
                <div className="flex items-center gap-5 mt-auto">
                  {t.avatar && typeof t.avatar === 'object' && (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden ring-4 ring-primary/10 shadow-lg">
                      <Media
                        resource={t.avatar}
                        fill
                        imgClassName="object-cover"
                        htmlElement={null}
                      />
                    </div>
                  )}
                  <div>
                    <div className="text-xl font-bold text-foreground">{t.author}</div>
                    <div className="text-base text-muted-foreground font-semibold uppercase tracking-widest leading-none mt-1">{t.role}</div>
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
