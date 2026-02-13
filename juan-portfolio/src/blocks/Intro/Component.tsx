import React from 'react'
import type { IntroBlock as IntroBlockProps } from '@/payload-types'

export const IntroBlock: React.FC<IntroBlockProps & { locale?: 'en' | 'es' }> = ({
  heading,
  body,
  locale: _locale = 'es'
}) => {
  return (
    <section className="container mx-auto px-4 md:px-8 py-12 md:py-24">
      <div className="max-w-4xl">
        <h2 className="text-3xl md:text-5xl font-array font-bold tracking-tight mb-8">
          {heading}
        </h2>
        
        {body && (
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mt-8">
            {body}
          </p>
        )}
      </div>
    </section>
  )
}
