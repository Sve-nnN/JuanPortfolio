'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect } from 'react'

import type { Page } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'

export const HighImpactHero: React.FC<Page['hero']> = (props) => {
  const { setHeaderTheme } = useHeaderTheme()
  const { links, media, richText } = props.hero

  useEffect(() => {
    setHeaderTheme('dark')
  })

  return (
    <div
      className="relative min-h-[100vh] flex items-center justify-center text-white overflow-hidden"
      data-theme="dark"
    >
      <div className="absolute inset-0 z-0">
        {media && typeof media === 'object' && (
          <Media className="object-cover w-full h-full" resource={media} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
      </div>

      <div className="container relative z-10 flex flex-col items-center justify-center pt-20">
        <div className="max-w-[50rem] md:text-center space-y-6 animate-fade-in-up">
          {richText && <RichText className="hero-text text-lg md:text-xl text-gray-200" data={richText} enableGutter={false} />}
          {Array.isArray(links) && links.length > 0 && (
            <ul className="flex flex-wrap md:justify-center gap-4 mt-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {links.map(({ link }, i) => {
                return (
                  <li key={i}>
                    <CMSLink {...link} className="btn-primary" />
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
