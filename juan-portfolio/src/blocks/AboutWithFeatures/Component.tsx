'use client'

import React from 'react'
import type { AboutWithFeaturesBlock } from '@/payload-types'
import Link from 'next/link'
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

export const AboutWithFeatures: React.FC<AboutWithFeaturesBlock> = (props) => {
  const { eyebrow, title, description, ctaText, ctaLink, features } = props

  return (
    <section className="py-24 md:py-32 bg-secondary" id="about">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <div className="space-y-8 sticky top-24">
            <div>
              {eyebrow && (
                <span className="text-primary font-bold tracking-wider uppercase text-sm mb-2 block">
                  {eyebrow}
                </span>
              )}
              {title && (
                <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground leading-tight">
                  {title}
                </h2>
              )}
            </div>

            {description && (
              <div className="text-muted-foreground text-lg md:text-xl leading-relaxed prose-lg">
                <RichText data={description} enableGutter={false} />
              </div>
            )}

            {ctaText && ctaLink && (
              <Link
                className="group text-primary font-semibold text-lg inline-flex items-center hover:text-primary/80 transition-colors"
                href={ctaLink}
              >
                <span className="border-b-2 border-primary/20 group-hover:border-primary transition-colors pb-1">
                  {ctaText}
                </span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features &&
              features.map((feature, index) => {
                const IconComponent = iconMap[feature.icon as keyof typeof iconMap] || Zap
                return (
                  <div
                    key={index}
                    className="p-8 bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </section>
  )
}
