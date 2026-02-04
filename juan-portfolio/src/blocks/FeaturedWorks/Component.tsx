import React from 'react'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import type { FeaturedWorksBlock, CaseStudy } from '@/payload-types'
import { Media } from '@/components/Media'

export const FeaturedWorks: React.FC<FeaturedWorksBlock> = (props) => {
  const { title, description, works, limit = 6, ctaLabel, ctaUrl } = props

  const displayWorks =
    works && Array.isArray(works)
      ? works.filter((w) => typeof w === 'object').slice(0, limit || 6)
      : []

  return (
    <section id="work" className="py-24 md:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {(title || description) && (
          <div className="max-w-3xl mb-16">
            {title && (
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6 leading-tight">
                {title}
              </h2>
            )}
            {description && <p className="text-xl text-muted-foreground leading-relaxed">{description}</p>}
          </div>
        )}

        {/* Works Grid */}
        {displayWorks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
            {displayWorks.map((w) => {
              const work = w as CaseStudy
              const heroImage = work.content?.heroImage

              return (
                <div key={work.id} className="group flex flex-col h-full">
                  <a href={`/case-studies/${work.slug || work.id}`} className="block overflow-hidden rounded-2xl mb-6 relative aspect-[4/3] bg-muted">
                    {heroImage && (
                      <Media
                        resource={heroImage}
                        fill
                        className="object-cover transition-transform duration-700 ease-&lsqb;cubic-bezier(0.25,1,0.5,1)&rsqb; group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  </a>

                  <div className="flex flex-col flex-grow">
                    <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      <a href={`/case-studies/${work.slug || work.id}`}>{work.title}</a>
                    </h3>
                    {work.meta?.description && (
                      <p className="text-muted-foreground mb-6 line-clamp-2 md:line-clamp-3">
                        {work.meta.description}
                      </p>
                    )}
                    <div className="mt-auto pt-2">
                      <a href={`/case-studies/${work.slug || work.id}`} className="inline-flex items-center text-primary font-semibold group/link">
                        <span className="border-b-2 border-transparent group-hover/link:border-primary transition-colors pb-0.5">
                          Ver caso de estudio
                        </span>
                        <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-2xl">
            <p className="text-muted-foreground text-lg">No se encontraron trabajos destacados en este momento.</p>
          </div>
        )}

        {/* CTA Button */}
        {ctaLabel && ctaUrl && (
          <div className="text-center mt-20">
            <a
              className="inline-flex items-center justify-center bg-foreground text-background font-medium py-4 px-8 rounded-full hover:bg-foreground/90 hover:-translate-y-0.5 transition-all shadow-lg"
              href={ctaUrl}
            >
              {ctaLabel}
            </a>
          </div>
        )}
      </div>
    </section >
  )
}
