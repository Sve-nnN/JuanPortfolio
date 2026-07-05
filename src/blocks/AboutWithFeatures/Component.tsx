'use client'

import React from 'react'
import type { AboutWithFeaturesBlock, Media as MediaType } from '@/payload-types'
import {
  Zap,
  Monitor,
  Lightbulb,
  TrendingUp,
  Code,
  Palette,
  Shield,
  Rocket,
  ArrowRight,
} from 'lucide-react'
import RichText from '@/components/RichText'
import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'

// Icon mapping
const iconMap = {
  Zap: Zap,
  Monitor: Monitor,
  Lightbulb: Lightbulb,
  TrendingUp: TrendingUp,
  Code: Code,
  Palette: Palette,
  Shield: Shield,
  Rocket: Rocket,
}

import { domAnimation, LazyMotion, m } from 'framer-motion'

export const AboutWithFeatures: React.FC<AboutWithFeaturesBlock & { locale?: 'en' | 'es' }> = (props) => {
  const { eyebrow, title, description, ctaText, ctaLink, features, image, locale = 'es' } = props

  return (
    <LazyMotion features={domAnimation}>
      <section className="py-24 md:py-48 bg-background relative" id="about">
        {/* Background Ambience */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-20">
          <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32 items-start">
            <m.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
              className="space-y-12 lg:sticky lg:top-32"
            >
              <div>
                {eyebrow && (
                  <span className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-6 block bg-primary/10 w-fit px-4 py-1.5 rounded-full shadow-sm">
                    {eyebrow}
                  </span>
                )}
                {title && (
                  <h2 className="text-section font-display font-bold text-foreground leading-[1.05] tracking-tight">
                    {title}
                  </h2>
                )}
              </div>

              {/* Optional Image if provided */}
              {image && typeof image === 'object' && (
                <m.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
                  className="relative aspect-video rounded-[3rem] overflow-hidden shadow-2xl border-2 border-border/50"
                >
                  <Media resource={image as MediaType} fill className="object-cover" />
                </m.div>
              )}

              {description && (
                <div className="text-muted-foreground text-xl md:text-2xl leading-relaxed prose-2xl dark:prose-invert font-medium max-w-xl">
                  <RichText data={description} enableGutter={false} />
                </div>
              )}

              {ctaText && ctaLink && (
                <CMSLink
                  url={ctaLink}
                  label={ctaText}
                  locale={locale}
                  className="group text-primary font-bold text-xl inline-flex items-center hover:text-primary/80 transition-all border-b-4 border-primary/20 hover:border-primary pb-2"
                >
                  <ArrowRight className="w-7 h-7 ml-3 group-hover:translate-x-3 transition-transform duration-500" />
                </CMSLink>
              )}
            </m.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
              {features &&
                features.map((feature, index) => {
                  const IconComponent = iconMap[feature.icon as keyof typeof iconMap] || Zap
                  return (
                    <m.div
                      key={index}
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ 
                        duration: 0.8, 
                        delay: index % 2 * 0.2, 
                        ease: [0.25, 0.1, 0.25, 1] 
                      }}
                      className="card-elevated p-10 group cursor-default border-t-[6px] border-t-primary/10"
                    >
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-10 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-700 shadow-inner group-hover:shadow-primary/20">
                        <IconComponent className="w-8 h-8 group-hover:rotate-12 transition-transform duration-500" />
                      </div>
                      <h3 className="text-card-title font-bold text-foreground mb-6 group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                      <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">
                        {feature.description}
                      </p>
                    </m.div>
                  )
                })}
            </div>
          </div>
        </div>
      </section>
    </LazyMotion>
  )
}
