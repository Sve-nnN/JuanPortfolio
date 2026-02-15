'use client'

import React from 'react'
import { ArrowRight } from 'lucide-react'
import RichText from '@/components/RichText'
import { Media } from '@/components/Media'
import type { HeroHomeBlock as HeroHomeBlockType } from '@/payload-types'
import { domAnimation, LazyMotion, m, useScroll, useTransform, type Variants } from 'framer-motion'
import { CMSLink } from '@/components/Link'

export const HeroHome: React.FC<HeroHomeBlockType & { locale?: 'en' | 'es' }> = (props) => {
  const { badge, title, subtitle, description, richText, primaryCta, secondaryCta, media, locale = 'es' } = props

  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 500], [0, 200])
  const y2 = useTransform(scrollY, [0, 500], [0, -150])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])
  const scale = useTransform(scrollY, [0, 500], [1, 0.9])

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1],
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
        <m.div 
          style={{ y: y1, opacity }}
          className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none"
        >
          <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/15 rounded-full blur-[120px] animate-pulse-slow" />
          <div
            className="absolute top-[30%] -right-[10%] w-[50%] h-[70%] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow"
            style={{ animationDelay: '1s' }}
          />
        </m.div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Text content */}
            <m.div
              style={{ y: y2, opacity }}
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="text-center lg:text-left flex flex-col items-center lg:items-start lg:order-1"
            >
              {badge && (
                <m.span
                  variants={itemVariants}
                  className="inline-flex items-center bg-primary/10 backdrop-blur-md border border-primary/20 text-primary text-xs font-bold tracking-[0.2em] uppercase px-4 py-1.5 rounded-full mb-8 shadow-sm"
                >
                  {badge}
                </m.span>
              )}

              <m.h1
                variants={itemVariants}
                className="font-display font-extrabold text-foreground mb-10 leading-[1.05] tracking-tight text-6xl md:text-8xl lg:text-9xl"
              >
                {title || 'Juan Carlos Angulo'}
                {subtitle && (
                  <>
                    <br />
                    <span
                      className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50 block mt-6 font-bold text-3xl md:text-5xl lg:text-6xl"
                    >
                      {subtitle}
                    </span>
                  </>
                )}
              </m.h1>

              {/* Description or RichText */}
              <m.div
                variants={itemVariants}
                className="max-w-2xl text-xl md:text-3xl text-muted-foreground mb-14 text-center lg:text-left leading-relaxed font-medium"
              >
                {richText ? (
                  <RichText className="prose-2xl dark:prose-invert" data={richText} enableGutter={false} />
                ) : description ? (
                  <p>{description}</p>
                ) : null}
              </m.div>

              <m.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-8 w-full sm:w-auto"
              >
                {primaryCta && primaryCta.label && primaryCta.url && (
                  <CMSLink
                    url={primaryCta.url}
                    label={primaryCta.label}
                    locale={locale}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 px-12 text-xl rounded-full transition-all shadow-2xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1.5 text-center active:scale-95"
                  />
                )}
                {secondaryCta && secondaryCta.label && secondaryCta.url && (
                  <CMSLink
                    url={secondaryCta.url}
                    label={secondaryCta.label}
                    locale={locale}
                    className="bg-background/50 backdrop-blur-xl text-foreground border-2 border-border/50 hover:border-primary/50 font-bold py-6 px-12 text-xl rounded-full hover:bg-secondary/50 transition-all flex items-center justify-center group active:scale-95 shadow-lg"
                  >
                    <ArrowRight
                      className="ml-3 group-hover:translate-x-2 transition-transform duration-500"
                      size={24}
                    />
                  </CMSLink>
                )}
              </m.div>
            </m.div>

            {/* Media/Image */}
            <m.div
              style={{ scale, rotate: 3 }}
              initial={{ opacity: 0, scale: 0.8, rotate: 10 }}
              animate={{ opacity: 1, scale: 1, rotate: 3 }}
              transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative flex justify-center items-center lg:order-2"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-primary/5 rounded-full blur-[100px] opacity-60 animate-pulse-slow"></div>
              {media && typeof media === 'object' && (
                <div className="relative w-72 h-72 md:w-96 md:h-96 lg:w-[35rem] lg:h-[35rem] rounded-[3rem] hover:rotate-0 transition-transform duration-700 ease-out overflow-hidden border-2 border-border/50 shadow-2xl bg-card">
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
