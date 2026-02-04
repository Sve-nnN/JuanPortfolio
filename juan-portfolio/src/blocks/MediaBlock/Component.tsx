import type { StaticImageData } from 'next/image'

import { cn } from '@/utilities/ui'
import React from 'react'
import RichText from '@/components/RichText'

import type { MediaBlock as MediaBlockProps } from '@/payload-types'

import { Media } from '@/components/Media/index'
import { AnimateOnScroll } from '@/components/AnimateOnScroll'

type Props = MediaBlockProps & {
  breakout?: boolean
  captionClassName?: string
  className?: string
  enableGutter?: boolean
  imgClassName?: string
  staticImage?: StaticImageData
  disableInnerContainer?: boolean
}

export const MediaBlock: React.FC<Props> = (props) => {
  const {
    captionClassName,
    className,
    enableGutter = true,
    imgClassName,
    media,
    staticImage,
    disableInnerContainer,
    animation,
  } = props

  let caption
  if (media && typeof media === 'object') caption = media.caption

  return (
    <AnimateOnScroll
      config={animation}
      className={cn(
        'py-8 md:py-12',
        {
          container: enableGutter,
        },
        className,
      )}
    >
      {(media || staticImage) && (
        <Media
          imgClassName={cn('border border-border rounded-xl shadow-lg transition-transform duration-500 hover:scale-[1.01]', imgClassName)}
          resource={media}
          src={staticImage}
        />
      )}
      {caption && (
        <div
          className={cn(
            'mt-4 md:mt-6',
            {
              container: !disableInnerContainer,
            },
            captionClassName,
          )}
        >
          <RichText
            data={caption}
            enableGutter={false}
            className="text-sm text-muted-foreground italic text-center max-w-2xl mx-auto"
          />
        </div>
      )}
    </AnimateOnScroll>
  )
}
