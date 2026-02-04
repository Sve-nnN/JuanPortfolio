import React from 'react'

import type { Page } from '@/payload-types'

import RichText from '@/components/RichText'

type LowImpactHeroType =
  | {
    children?: React.ReactNode
    richText?: never
  }
  | (Omit<Page['hero'], 'richText'> & {
    children?: never
    richText?: Page['hero']['hero']['richText']
  })

export const LowImpactHero: React.FC<LowImpactHeroType> = ({ children, richText }) => {
  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-[48rem]">
        {children || (
          richText && (
            <RichText
              className="mb-6 text-lg md:text-xl font-light tracking-wide"
              data={richText}
              enableGutter={false}
            />
          )
        )}
      </div>
    </div>
  )
}
