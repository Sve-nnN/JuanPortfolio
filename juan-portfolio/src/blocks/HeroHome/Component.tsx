import React from 'react'
import { ArrowRight } from 'lucide-react'
import RichText from '@/components/RichText'
import { Media } from '@/components/Media'
import type { HeroHomeBlock as HeroHomeBlockType } from '@/payload-types'
export type { HeroHomeBlockType as HeroHomeBlock }

export const HeroHome: React.FC<HeroHomeBlockType> = (props) => {
  const { badge, title, subtitle, description, richText, primaryCta, secondaryCta, media } = props

  return (
    <section className="py-24 md:py-32 lg:py-40 relative overflow-hidden" id="home">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text content */}
          <div className="text-center lg:text-left flex flex-col items-center lg:items-start order-2 lg:order-1">
            {badge && (
              <span className="inline-flex items-center bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full mb-6 border border-primary/20">
                {badge}
              </span>
            )}

            <h1 className="text-4xl md:text-5xl lg:text-7xl font-display font-extrabold text-foreground mb-6 leading-tight tracking-tight">
              {title || 'Juan Carlos Angulo'}
              {subtitle && (
                <>
                  <br />
                  <span className="text-2xl md:text-4xl lg:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 block mt-2 font-normal">
                    {subtitle}
                  </span>
                </>
              )}
            </h1>

            {/* Description or RichText */}
            <div className="max-w-xl text-lg md:text-xl text-muted-foreground mb-8 text-center lg:text-left">
              {richText ? (
                <RichText className="prose-lg" data={richText} enableGutter={false} />
              ) : description ? (
                <p>{description}</p>
              ) : null}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              {primaryCta && primaryCta.label && primaryCta.url && (
                <a
                  href={primaryCta.url}
                  className="bg-primary text-primary-foreground font-semibold py-4 px-8 rounded-full hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 text-center"
                >
                  {primaryCta.label}
                </a>
              )}
              {secondaryCta && secondaryCta.label && secondaryCta.url && (
                <a
                  href={secondaryCta.url}
                  className="bg-transparent text-foreground border border-border font-medium py-4 px-8 rounded-full hover:bg-secondary/50 transition-colors flex items-center justify-center group"
                >
                  <span>{secondaryCta.label}</span>
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </a>
              )}
            </div>
          </div>

          {/* Media/Image */}
          <div className="relative flex justify-center items-center order-1 lg:order-2">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-full blur-3xl opacity-60 animate-pulse-slow"></div>
            {media && typeof media === 'object' && (
              <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-[30rem] lg:h-[30rem] rounded-2xl rotate-3 hover:rotate-0 transition-transform duration-500 ease-out overflow-hidden border border-border/50 shadow-2xl bg-card">
                <Media resource={media} fill priority className="w-full h-full object-cover aspect-square" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
