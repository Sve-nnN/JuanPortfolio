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
    <div className="container pt-16 pb-16 md:pt-20 md:pb-24">
      <div className="max-w-[48rem]">
        {children || (
          richText && (
            <RichText
              className="mb-6 font-light tracking-wide"
              style={{ fontSize: 'clamp(1.25rem, 2.5vw, 2.5rem)' }}
              data={richText}
              enableGutter={false}
            />
          )
        )}
      </div>
    </div>
  )
}
