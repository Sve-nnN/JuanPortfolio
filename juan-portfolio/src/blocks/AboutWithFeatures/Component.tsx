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
    <section className="py-20 md:py-28" id="about">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            {eyebrow && <span className="text-primary font-semibold">{eyebrow}</span>}
            {title && (
              <h2 className="text-3xl md:text-4xl font-display font-bold text-current mt-2 mb-6">
                {title}
              </h2>
            )}
            {description && (
              <div className="text-muted mb-6 text-lg prose dark:prose-invert max-w-none">
                <RichText data={description} enableGutter={false} />
              </div>
            )}
            {ctaText && ctaLink && (
              <Link
                className="text-primary font-semibold hover:underline inline-flex items-center"
                href={ctaLink}
              >
                <span>{ctaText}</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 grid-rows-2 gap-4">
            {features &&
              features.map((feature, index) => {
                const IconComponent = iconMap[feature.icon as keyof typeof iconMap] || Zap
                return (
                  <div
                    key={index}
                    className="p-6 bg-card rounded-lg shadow-md flex flex-col items-center text-center hover:shadow-lg transition-shadow"
                  >
                    <IconComponent className="w-10 h-10 text-primary mb-3" />
                    <h3 className="text-lg font-bold text-current mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
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
