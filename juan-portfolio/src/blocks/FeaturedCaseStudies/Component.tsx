'use client'

import React from 'react'
import type { FeaturedCaseStudiesBlock } from '@/payload-types'
import Link from 'next/link'
import { Media } from '@/components/Media'
import { ArrowRight } from 'lucide-react'

export const FeaturedCaseStudies: React.FC<FeaturedCaseStudiesBlock> = (props) => {
  const { title, description, caseStudies, ctaText, ctaLink } = props

  // Get case studies list
  const caseStudiesList =
    caseStudies && Array.isArray(caseStudies)
      ? caseStudies.map((cs) => (typeof cs === 'object' ? cs : null)).filter(Boolean)
      : []

  return (
    <section className="py-20 md:py-28" id="work">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-current">{title}</h2>
          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">{description}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {caseStudiesList.map((caseStudy) => {
            if (!caseStudy) return null
            return (
              <div
                key={caseStudy.id}
                className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 group"
              >
                <Link href={`/casos-de-estudio/${caseStudy.slug}`}>
                  {caseStudy.content?.heroImage && (
                    <div className="w-full h-64 overflow-hidden">
                      <Media
                        resource={caseStudy.content.heroImage}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-current mb-2">{caseStudy.title}</h3>
                    {caseStudy.meta?.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {caseStudy.meta.description}
                      </p>
                    )}
                    <span className="text-primary font-semibold group-hover:underline inline-flex items-center">
                      Ver caso de estudio <ArrowRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
        {ctaText && ctaLink && (
          <div className="text-center mt-12">
            <Link
              className="bg-primary text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors inline-block"
              href={ctaLink}
            >
              {ctaText}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
