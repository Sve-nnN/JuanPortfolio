import React from 'react'
import type { CallToActionBlock as CallToActionBlockProps } from '@/payload-types'
import { CMSLink } from '@/components/Link'
import RichText from '@/components/RichText'

export const CallToActionBlock: React.FC<CallToActionBlockProps & { locale?: 'en' | 'es' }> = ({
  links,
  richText,
  locale = 'es'
}) => {
  return (
    <section className="container mx-auto px-4 md:px-8 py-12 md:py-24">
      <div className="bg-card border border-border p-8 md:p-16 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative group">
        <div className="relative z-10 max-w-2xl">
          {richText && (
            <RichText 
              className="text-3xl md:text-5xl font-array font-bold tracking-tight mb-0" 
              data={richText} 
              enableGutter={false} 
            />
          )}
        </div>
        
        <div className="relative z-10 flex flex-wrap gap-4 shrink-0">
          {(links || []).map(({ link }, i) => {
            return (
              <CMSLink 
                key={i} 
                {...link} 
                locale={locale}
                className="px-8 py-4 text-base font-bold rounded-2xl" 
              />
            )
          })}
        </div>

        {/* Decoration */}
        <div className="absolute top-0 right-0 -z-0 opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none translate-x-1/4 -translate-y-1/4">
          <div className="w-96 h-96 rounded-full bg-primary blur-3xl" />
        </div>
      </div>
    </section>
  )
}
