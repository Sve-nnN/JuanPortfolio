import React from 'react'
import type { CaseStudyHeaderBlock } from '@/payload-types'
import { Media } from '@/components/Media'

export const CaseStudyHeader: React.FC<CaseStudyHeaderBlock & { locale?: 'en' | 'es' }> = ({
  eyebrow,
  title,
  description,
  featuredImage,
  projectInfo,
  locale: _locale,
}) => {
  return (
    <section className="container mx-auto px-4 pt-16 pb-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          {eyebrow && (
            <span className="inline-block text-primary font-bold uppercase tracking-widest text-sm mb-6 bg-primary/10 px-4 py-1.5 rounded-full">
              {eyebrow}
            </span>
          )}
          <h1 className="text-display font-display font-bold tracking-tighter mb-8 leading-[0.9] text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-xl md:text-3xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
              {description}
            </p>
          )}
        </div>

        {featuredImage && typeof featuredImage === 'object' && (
          <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl mb-16">
            <Media resource={featuredImage} fill className="object-cover" />
          </div>
        )}

        {projectInfo && projectInfo.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-y border-border">
            {projectInfo.map((info, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {info.label}
                </span>
                <span className="text-lg font-medium">{info.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
