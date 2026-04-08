import { cn } from '@/utilities/ui'
import React from 'react'
import RichText from '@/components/RichText'

import type { ContentBlock as ContentBlockProps } from '@/payload-types'

import { CMSLink } from '../../components/Link'
import { AnimateOnScroll } from '@/components/AnimateOnScroll'

export const ContentBlock: React.FC<ContentBlockProps> = (props) => {
  const { columns, animation } = props

  const colsSpanClasses = {
    full: '12',
    half: '6',
    oneThird: '4',
    twoThirds: '8',
  }

  return (
    <AnimateOnScroll config={animation} className="container py-16 md:py-24 lg:py-32">
      <div className="grid grid-cols-4 lg:grid-cols-12 gap-y-12 lg:gap-x-16">
        {columns &&
          columns.length > 0 &&
          columns.map((col, index) => {
            const { enableLink, link, richText, size } = col

            return (
              <div
                className={cn(`col-span-4 lg:col-span-${colsSpanClasses[size!]}`, {
                  'md:col-span-2': size !== 'full' && size !== 'twoThirds',
                })}
                key={index}
              >
                {richText && (
                  <RichText
                    data={richText}
                    enableGutter={false}
                    className="prose-lg"
                  />
                )}

                {enableLink && <CMSLink {...link} className="mt-6" />}
              </div>
            )
          })}
      </div>
    </AnimateOnScroll>
  )
}
