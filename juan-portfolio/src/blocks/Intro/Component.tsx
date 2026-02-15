import React from 'react'
import type { IntroBlock as IntroBlockProps } from '@/payload-types'

export const IntroBlock: React.FC<IntroBlockProps & { locale?: 'en' | 'es' }> = ({
  heading,
  body,
  locale: _locale = 'es'
}) => {
  return (
    <section className="container mx-auto px-4 md:px-8 py-16 md:py-32">
      <div className="max-w-5xl">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight mb-10 leading-[1.1] text-foreground">
          {heading}
        </h2>
        
        {body && (
          <p className="text-xl md:text-3xl text-muted-foreground leading-relaxed mt-12 font-medium max-w-4xl">
            {body}
          </p>
        )}
      </div>
    </section>
  )
}
