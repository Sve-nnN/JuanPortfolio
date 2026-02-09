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
          <Media
            className="object-cover w-full h-full opacity-60 transition-opacity duration-1000 ease-in-out"
            resource={media}
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
      </div>

      <div className="container relative z-10 flex flex-col items-center justify-center pt-20 md:pt-32">
        <div className="max-w-[60rem] md:text-center space-y-8 animate-fade-in-up">
          {richText && (
            <RichText
              className="hero-text font-light tracking-wide text-gray-100 mix-blend-plus-lighter"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 3.5rem)' }}
              data={richText}
              enableGutter={false}
            />
          )}
          {Array.isArray(links) && links.length > 0 && (
            <ul className="flex flex-wrap md:justify-center gap-6 mt-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {links.map(({ link }, i) => {
                return (
                  <li key={i}>
                    <CMSLink {...link} className="btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" />
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
