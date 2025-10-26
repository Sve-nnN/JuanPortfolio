import React from 'react'
import { Zap, Monitor, Lightbulb, TrendingUp, Rocket, Shield, ArrowRight } from 'lucide-react'
import type { AboutSectionBlock } from '@/payload-types'

const iconMap = {
  zap: Zap,
  monitor: Monitor,
  lightbulb: Lightbulb,
  'trending-up': TrendingUp,
  rocket: Rocket,
  shield: Shield,
}

export const AboutSectionBlock: React.FC<AboutSectionBlock> = (props) => {
  const { eyebrow, title, paragraphs, ctaLabel, ctaUrl, features } = props

  return (
    <section className="py-20 md:py-28" id="about">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Text content */}
          <div>
            {eyebrow && <span className="text-primary font-semibold">{eyebrow}</span>}
            {title && (
              <h2 className="text-3xl md:text-4xl font-display font-bold text-current mt-2 mb-6">
                {title}
              </h2>
            )}
            {paragraphs &&
              paragraphs.map((p, i) => (
                <p key={i} className="text-muted mb-4 text-lg">
                  {p.text}
                </p>
              ))}
            {ctaLabel && ctaUrl && (
              <a
                className="text-primary font-semibold hover:underline flex items-center"
                href={ctaUrl}
              >
                <span>{ctaLabel}</span>
                <ArrowRight className="ml-1" size={18} />
              </a>
            )}
          </div>

          {/* Features grid */}
          {features && features.length > 0 && (
            <div className="grid grid-cols-2 grid-rows-2 gap-4">
              {features.map((feature, i) => {
                const IconComponent = iconMap[feature.icon as keyof typeof iconMap] || Zap
                return (
                  <div
                    key={i}
                    className="p-6 bg-card rounded-lg shadow-md flex flex-col items-center text-center"
                  >
                    <IconComponent className="text-primary mb-3" size={36} />
                    <h3 className="text-lg font-bold text-current mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
