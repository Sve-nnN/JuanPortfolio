import React from 'react'
import type { AboutSectionBlock as AboutSectionBlockProps } from '@/payload-types'
import { CMSLink } from '@/components/Link'

export const AboutSection: React.FC<AboutSectionBlockProps & { locale?: 'en' | 'es' }> = (props) => {
  const { title, paragraphs, ctaLabel, ctaUrl, locale = 'es' } = props
  
  return (
    <section className="py-20 md:py-20 overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="order-2 lg:order-1">
            <h2 className="text-section font-array font-bold tracking-tighter mb-8 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {title}
            </h2>
            <div className="prose prose-xl dark:prose-invert text-muted-foreground mb-12">
              {(paragraphs || []).map((p, i) => (
                <p key={i}>{p.text}</p>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              {ctaLabel && ctaUrl && (
                <CMSLink 
                  url={ctaUrl}
                  label={ctaLabel}
                  appearance="default"
                  locale={locale}

                />
              )}
            </div>
          </div>
          
          <div className="order-1 lg:order-2">
            <div className="relative aspect-square md:aspect-[4/5] rounded-3xl overflow-hidden group shadow-2xl bg-muted">
              {/* Image field removed from schema, using placeholder or decoration */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
