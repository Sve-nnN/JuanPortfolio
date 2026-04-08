import React from 'react'
import type { FeaturedCaseStudiesBlock } from '@/payload-types'
import { Card } from '@/components/Card'

export const FeaturedCaseStudies: React.FC<FeaturedCaseStudiesBlock & { locale?: 'en' | 'es' }> = (props) => {
  const { title, description, caseStudies, locale = 'es' } = props

  if (!caseStudies || caseStudies.length === 0) return null

  return (
    <section className="py-12 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {(title || description) && (
          <div className="max-w-3xl mb-12">
            {title && <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">{title}</h2>}
            {description && <p className="text-lg text-muted-foreground">{description}</p>}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {caseStudies.map((cs) => {
            if (typeof cs === 'string') return null
            // Convert CaseStudy to CardPostData format
            const cardData = {
              slug: cs.slug,
              title: cs.title,
              meta: cs.meta,
              categories: [], // Case studies don't have categories in this schema
            }
            return (
              <Card 
                key={cs.id} 
                doc={cardData} 
                relationTo="case-studies" 
                showCategories={false} 
                locale={locale}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
