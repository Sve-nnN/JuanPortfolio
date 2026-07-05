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
    <section className="container mx-auto px-4 md:px-8 py-12 md:py-20">
      <div className="card-elevated p-10 md:p-24 flex flex-col lg:flex-row items-center justify-between gap-10 overflow-hidden relative group cursor-default border-t-[8px] border-t-primary/20">
        <div className="relative z-10 max-w-3xl">
          {richText && (
            <RichText 
              className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight mb-0 leading-[1.05] text-foreground" 
              data={richText} 
              enableGutter={false} 
            />
          )}
        </div>
        
        <div className="relative z-10 flex flex-wrap gap-6 shrink-0 justify-center md:justify-start">
          {(links || []).map(({ link }, i) => {
            return (
              <CMSLink
                key={i}
                {...link}
                locale={locale}
                appearance={link?.appearance || 'default'}

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
