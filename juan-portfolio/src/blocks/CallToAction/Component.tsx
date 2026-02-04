import React from 'react'

import type { CallToActionBlock as CTABlockProps } from '@/payload-types'

import RichText from '@/components/RichText'
import { CMSLink } from '@/components/Link'
import { AnimateOnScroll } from '@/components/AnimateOnScroll'

export const CallToActionBlock: React.FC<CTABlockProps> = ({ links, richText, animation }) => {
  return (
    <AnimateOnScroll config={animation} className="container py-12 md:py-20 lg:py-24">
      <div className="bg-gradient-to-br from-card to-card/50 rounded-xl border border-border/50 p-8 md:p-12 lg:p-16 shadow-2xl flex flex-col gap-8 md:flex-row md:justify-between md:items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 opacity-0 hover:opacity-10 transition-opacity duration-500" />
        <div className="max-w-[48rem] flex items-center relative z-10">
          {richText && (
            <RichText
              className="mb-0 text-lg md:text-xl font-medium"
              data={richText}
              enableGutter={false}
            />
          )}
        </div>
        <div className="flex flex-col gap-4 md:gap-6 relative z-10">
          {(links || []).map(({ link }, i) => {
            return <CMSLink key={i} size="lg" {...link} className="w-full md:w-auto text-lg px-8 py-6" />
          })}
        </div>
      </div>
    </AnimateOnScroll>
  )
}
