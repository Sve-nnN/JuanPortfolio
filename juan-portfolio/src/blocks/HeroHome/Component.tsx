import React from 'react'
import { ArrowRight } from 'lucide-react'
import RichText from '@/components/RichText'
import { Media } from '@/components/Media'
import type { HeroHomeBlock as HeroHomeBlockType } from '@/payload-types'
export type { HeroHomeBlockType as HeroHomeBlock }

export const HeroHome: React.FC<HeroHomeBlockType> = (props) => {
  const { badge, title, subtitle, description, richText, primaryCta, secondaryCta, media } = props
  const titleLength = title ? title.length : 0
  let titleSizeClass = 'text-5xl md:text-6xl lg:text-[5.5rem]' // Default (Medium-Long)

  if (titleLength < 20) {
    titleSizeClass = 'text-6xl md:text-7xl lg:text-[7rem]' // Short & Massive
  } else if (titleLength > 40) {
    titleSizeClass = 'text-4xl md:text-5xl lg:text-6xl' // Long
  }

  return (
    <section className="min-h-[calc(100vh-80px)] flex items-center pt-32 pb-20 relative overflow-hidden" id="home">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute top-[30%] -right-[10%] w-[50%] h-[70%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text content */}
          <div className="text-center lg:text-left flex flex-col items-center lg:items-start lg:order-1">
            {badge && (
              <span className="inline-flex items-center bg-primary/10 backdrop-blur-md border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full mb-6 animate-fade-in-up">
                {badge}
              </span>
            )}

            <h1
              className={`font-display font-extrabold text-foreground mb-6 leading-tight lg:leading-[1.1] tracking-tight animate-fade-in-up`}
              style={{ animationDelay: '0.1s', fontSize: 'clamp(3rem, 5vw, 5rem)' }}
            >
              {title || 'Juan Carlos Angulo'}
              {subtitle && (
                <>
                  <br />
                  <span
                    className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 block mt-2 font-normal"
                    style={{ fontSize: 'clamp(1.2rem, 2vw, 2.5rem)' }}
                  >
                    {subtitle}
                  </span>
                </>
              )}
            </h1>

            {/* Description or RichText */}
            <div
              className="max-w-xl text-lg md:text-xl text-muted-foreground mb-10 text-center lg:text-left animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              {richText ? (
                <RichText className="prose-lg" data={richText} enableGutter={false} />
              ) : description ? (
                <p>{description}</p>
              ) : null}
            </div>

            <div
              className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              {primaryCta && primaryCta.label && primaryCta.url && (
                <a
                  href={primaryCta.url}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-5 px-10 text-lg rounded-full transition-all shadow-xl hover:shadow-primary/25 hover:-translate-y-1 text-center"
                >
                  {primaryCta.label}
                </a>
              )}
              {secondaryCta && secondaryCta.label && secondaryCta.url && (
                <a
                  href={secondaryCta.url}
                  className="bg-background/50 backdrop-blur-sm text-foreground border border-border/50 hover:border-primary/50 font-medium py-5 px-10 text-lg rounded-full hover:bg-secondary/50 transition-all flex items-center justify-center group"
                >
                  <span>{secondaryCta.label}</span>
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </a>
              )}
            </div>
          </div>

          {/* Media/Image */}
          <div className="relative flex justify-center items-center lg:order-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
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
