import React from 'react'
import type { TestimonialsCarouselBlock, Testimonial } from '@/payload-types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Media } from '@/components/Media'
import { Star } from 'lucide-react'

interface Props extends TestimonialsCarouselBlock {}

export const TestimonialsCarouselBlock: React.FC<Props> = async ({
  title = 'Testimonios',
  showRating = true,
  limit = 8,
}) => {
  let testimonials: Testimonial[] = []
  try {
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'testimonials',
      limit,
      sort: '-createdAt',
      depth: 1,
    })
    testimonials = (res.docs as Testimonial[]) || []
  } catch {
    testimonials = []
  }

  if (!testimonials.length) return null

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-current">{title}</h2>
        </div>
        <div className="w-full overflow-x-auto">
          <div className="flex gap-8 snap-x snap-mandatory overflow-x-auto pb-4">
            {testimonials.map((t, idx) => (
              <div
                key={t.id || idx}
                className="min-w-[320px] max-w-xs bg-card rounded-lg shadow-lg p-6 flex flex-col items-center snap-center mx-auto"
              >
                {t.avatar && (
                  <div className="w-16 h-16 mb-4 rounded-full overflow-hidden border-2 border-primary">
                    <Media
                      resource={t.avatar}
                      className="w-full h-full object-cover"
                      imgClassName="w-full h-full object-cover"
                    />
                  </div>
                )}
                <blockquote className="italic text-lg text-muted mb-4">
                  “{t.testimonial}”
                </blockquote>
                <div className="font-semibold text-current mb-1">{t.author}</div>
                {t.role && <div className="text-sm text-gray-500 mb-1">{t.role}</div>}
                {t.company && <div className="text-sm text-gray-500 mb-2">{t.company}</div>}
                {showRating && t.rating && (
                  <div className="flex gap-1 mt-2">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default TestimonialsCarouselBlock
