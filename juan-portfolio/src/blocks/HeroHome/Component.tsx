import React from 'react'
import { ArrowRight } from 'lucide-react'
import RichText from '@/components/RichText'
import { Media } from '@/components/Media'
import type { HeroHomeBlock } from '@/payload-types'

export const HeroHomeBlock: React.FC<HeroHomeBlock> = (props) => {
  const { badge, title, subtitle, description, richText, primaryCta, secondaryCta, media } = props

  return (
    <section className="py-24 md:py-32" id="home">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div className="text-center md:text-left">
            {badge && (
              <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">
                {badge}
              </span>
            )}

            {/* Title is always H1 (SEO requirement) */}
            <h1 className="text-4xl md:text-6xl font-display font-bold text-current mb-4 leading-tight">
              {title || 'Juan Carlos Angulo'}
              {subtitle && (
                <>
                  <br />
                  <span className="text-2xl md:text-3xl gradient-text block mt-2">{subtitle}</span>
                </>
              )}
            </h1>

            {/* Description or RichText */}
            {richText ? (
              <div className="mb-8 prose prose-lg dark:prose-invert max-w-none">
                <RichText className="" data={richText} enableGutter={false} />
              </div>
            ) : description ? (
              <p className="max-w-xl text-lg text-gray-700 dark:text-gray-300 mb-8 mx-auto md:mx-0">
                {description}
              </p>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              {primaryCta && primaryCta.label && primaryCta.url && (
                <a
                  href={primaryCta.url}
                  className="bg-primary text-white font-medium py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto text-center"
                >
                  {primaryCta.label}
                </a>
              )}
              {secondaryCta && secondaryCta.label && secondaryCta.url && (
                <a
                  href={secondaryCta.url}
                  className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium py-3 px-8 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center w-full sm:w-auto"
                >
                  <span>{secondaryCta.label}</span>
                  <ArrowRight className="ml-2" size={20} />
                </a>
              )}
            </div>
          </div>

          {/* Media/Image */}
          <div className="relative flex justify-center items-center">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-full blur-3xl opacity-30 dark:opacity-20"></div>
            {media && typeof media === 'object' && (
              <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-full overflow-hidden border-8 border-white dark:border-card-dark shadow-2xl">
                <Media
                  resource={media}
                  className="w-full h-full object-cover"
                  imgClassName="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
