import React from 'react'

import type { Page } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'

export const MediumImpactHero: React.FC<Page['hero'] & { locale?: 'en' | 'es' }> = (props) => {
  const { links, media, richText } = props.hero
  const locale = props.locale

  return (
    <div className="pt-20 pb-20 md:pt-28 md:pb-28 lg:pb-32">
      <div className="container mb-12 md:mb-16">
        <div className="max-w-[50rem] space-y-8 animate-fade-in-up">
          {richText && (
            <RichText
              className="font-light tracking-wide text-foreground"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 3rem)' }}
              data={richText}
              enableGutter={false}
            />
          )}

          {Array.isArray(links) && links.length > 0 && (
            <ul className="flex flex-wrap gap-4 mt-8">
              {links.map(({ link }, i) => {
                return (
                  <li key={i}>
                    <CMSLink {...link} locale={locale} className="btn-primary px-6 py-3" />
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
      <div className="container">
        {media && typeof media === 'object' && (
          <div className="relative animate-fade-in">
            <Media
              className="w-full aspect-video object-cover rounded-lg shadow-2xl"
              resource={media}
              priority
            />
            {media?.caption && (
              <div className="mt-4 text-sm text-muted-foreground text-center italic">
                <RichText data={media.caption} enableGutter={false} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
