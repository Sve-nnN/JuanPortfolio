import React from 'react'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import type { FeaturedWorksBlock, CaseStudy } from '@/payload-types'

export const FeaturedWorksBlock: React.FC<FeaturedWorksBlock> = (props) => {
  const { title, description, works, limit = 6, ctaLabel, ctaUrl } = props

  const displayWorks =
    works && Array.isArray(works) ? works.filter((w) => typeof w === 'object').slice(0, limit) : []

  return (
    <section id="work" className="py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {(title || description) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="text-3xl md:text-4xl font-display font-bold text-current">{title}</h2>
            )}
            {description && <p className="mt-4 text-lg text-muted">{description}</p>}
          </div>
        )}

        {/* Works Grid */}
        {displayWorks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {displayWorks.map((w) => {
              const work = w as CaseStudy
              const coverUrl =
                work.heroImage && typeof work.heroImage === 'object' && 'url' in work.heroImage
                  ? work.heroImage.url
                  : null

              const coverAlt =
                work.heroImage && typeof work.heroImage === 'object' && 'alt' in work.heroImage
                  ? work.heroImage.alt
                  : work.title || ''

              return (
                <div
                  key={work.id}
                  className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 group"
                >
                  <a href={`/case-studies/${work.slug || work.id}`}>
                    {coverUrl && (
                      <div className="relative w-full h-64">
                        <Image
                          src={coverUrl}
                          alt={coverAlt || ''}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-current mb-2">{work.title}</h3>
                      {work.meta?.description && (
                        <p className="text-muted mb-4">{work.meta.description}</p>
                      )}
                      {work.categories && work.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {work.categories.map((cat, i) => {
                            const category = typeof cat === 'object' ? cat : null
                            const catTitle =
                              category && 'title' in category
                                ? (category.title as string)
                                : String(cat)
                            return (
                              <span
                                key={i}
                                className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full"
                              >
                                {catTitle}
                              </span>
                            )
                          })}
                        </div>
                      )}
                      <span className="text-primary font-semibold group-hover:underline">
                        Ver caso de estudio <ArrowRight className="inline align-middle" size={16} />
                      </span>
                    </div>
                  </a>
                </div>
              )
            })}
          </div>
        )}

        {/* CTA Button */}
        {ctaLabel && ctaUrl && (
          <div className="text-center mt-12">
            <a
              className="bg-primary text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors inline-block"
              href={ctaUrl}
            >
              {ctaLabel}
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
