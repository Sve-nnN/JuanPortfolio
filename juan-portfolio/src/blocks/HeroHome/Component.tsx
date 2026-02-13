'use client'

import React from 'react'
import { ArrowRight } from 'lucide-react'
import RichText from '@/components/RichText'
import { Media } from '@/components/Media'
import type { HeroHomeBlock as HeroHomeBlockType } from '@/payload-types'
import { domAnimation, LazyMotion, m } from 'framer-motion'
import { CMSLink } from '@/components/Link'

export const HeroHome: React.FC<HeroHomeBlockType & { locale?: 'en' | 'es' }> = (props) => {
  const { badge, title, subtitle, description, richText, primaryCta, secondaryCta, media, locale = 'es' } = props

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <LazyMotion features={domAnimation}>
      <section
        className="min-h-[calc(100vh-80px)] flex items-center pt-32 pb-20 relative overflow-hidden"
        id="home"
      >
        {/* Background Ambience */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
          <div
            className="absolute top-[30%] -right-[10%] w-[50%] h-[70%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse-slow"
            style={{ animationDelay: '1s' }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text content */}
            <m.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="text-center lg:text-left flex flex-col items-center lg:items-start lg:order-1"
            >
              {badge && (
                <m.span
                  variants={itemVariants}
                  className="inline-flex items-center bg-primary/10 backdrop-blur-md border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full mb-6"
                >
                  {badge}
                </m.span>
              )}

              <m.h1
                variants={itemVariants}
                className="font-display font-extrabold text-foreground mb-6 leading-tight lg:leading-[1.1] tracking-tight"
                style={{ fontSize: 'clamp(3rem, 5vw, 5rem)' }}
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
              </m.h1>

              {/* Description or RichText */}
              <m.div
                variants={itemVariants}
                className="max-w-xl text-lg md:text-xl text-muted-foreground mb-10 text-center lg:text-left"
              >
                {richText ? (
                  <RichText className="prose-lg" data={richText} enableGutter={false} />
                ) : description ? (
                  <p>{description}</p>
                ) : null}
              </m.div>

              <m.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto"
              >
                {primaryCta && primaryCta.label && primaryCta.url && (
                  <CMSLink
                    url={primaryCta.url}
                    label={primaryCta.label}
                    locale={locale}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-5 px-10 text-lg rounded-full transition-all shadow-xl hover:shadow-primary/25 hover:-translate-y-1 text-center"
                  />
                )}
                {secondaryCta && secondaryCta.label && secondaryCta.url && (
                  <CMSLink
                    url={secondaryCta.url}
                    label={secondaryCta.label}
                    locale={locale}
                    className="bg-background/50 backdrop-blur-sm text-foreground border border-border/50 hover:border-primary/50 font-medium py-5 px-10 text-lg rounded-full hover:bg-secondary/50 transition-all flex items-center justify-center group"
                  >
                    <ArrowRight
                      className="ml-2 group-hover:translate-x-1 transition-transform"
                      size={20}
                    />
                  </CMSLink>
                )}
              </m.div>
            </m.div>

            {/* Media/Image */}
            <m.div
              initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 3 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="relative flex justify-center items-center lg:order-2"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-full blur-3xl opacity-60 animate-pulse-slow"></div>
              {media && typeof media === 'object' && (
                <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-[30rem] lg:h-[30rem] rounded-2xl hover:rotate-0 transition-transform duration-500 ease-out overflow-hidden border border-border/50 shadow-2xl bg-card">
                  <Media
                    resource={media}
                    fill
                    priority
                    className="w-full h-full object-cover aspect-square"
                  />
                </div>
              )}
            </m.div>
          </div>
        </div>
      </section>
    </LazyMotion>
  )
}
