import React from 'react'
import type { TestimonialsCarouselBlock, Testimonial } from '@/payload-types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Media } from '@/components/Media'
import { Star } from 'lucide-react'

export const TestimonialsCarousel: React.FC<TestimonialsCarouselBlock> = async ({
  title = 'Testimonios',
  showRating = true,
  limit = 8,
}) => {
  let testimonials: Testimonial[] = []
  try {
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'testimonials',
      limit: limit || 10,
      sort: '-createdAt',
      depth: 1,
    })
    testimonials = (res.docs as Testimonial[]) || []
  } catch {
    testimonials = []
  }

  if (!testimonials.length) return null

  return (
    <section className="py-24 md:py-32 bg-card border-y border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">{title}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Lo que dicen mis clientes sobre trabajar conmigo.
          </p>
        </div>

        <div className="w-full relative">
          <div className="flex gap-6 overflow-x-auto pb-12 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {testimonials.map((t, idx) => (
              <div
                key={t.id || idx}
                className="min-w-[85vw] sm:min-w-[400px] bg-background rounded-2xl p-8 border border-border shadow-sm flex flex-col snap-center relative"
              >
                {/* Quote Icon Background */}
                <div className="absolute top-6 right-6 text-muted/20">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 7.55228 14.017 7V3H19.017C20.6739 3 22.017 4.34315 22.017 6V15C22.017 16.6569 20.6739 18 19.017 18H16.017V21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 7.55228 5.0166 7V3H10.0166C11.6735 3 13.0166 4.34315 13.0166 6V15C13.0166 16.6569 11.6735 18 10.0166 18H7.0166V21H5.0166Z" />
                  </svg>
                </div>

                {showRating && t.rating && (
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < t.rating! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-gray-700'}`}
                      />
                    ))}
                  </div>
                )}

                <blockquote className="text-lg md:text-xl font-medium text-foreground leading-relaxed mb-8 flex-grow">
                  &ldquo;{t.testimonial}&rdquo;
                </blockquote>

                <div className="flex items-center gap-4 mt-auto">
                  {t.avatar && (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted">
                      <Media resource={t.avatar} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-foreground text-base">{t.author}</div>
                    {(t.role || t.company) && (
                      <div className="text-sm text-muted-foreground">
                        {t.role} {t.role && t.company && '·'} {t.company}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default TestimonialsCarousel
