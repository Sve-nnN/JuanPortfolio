import React from 'react'
import type { MediaBlock as MediaBlockProps, Media as MediaType } from '@/payload-types'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'

export const MediaBlock: React.FC<
  MediaBlockProps & {
    className?: string
    captionClassName?: string
    imgClassName?: string
    enableGutter?: boolean
    disableInnerContainer?: boolean
    locale?: 'en' | 'es'
  }
> = ({
  media,
  className,
  captionClassName,
  imgClassName,
  enableGutter = true,
  disableInnerContainer = false,
  locale: _locale
}) => {
  const caption = media && typeof media === 'object' ? (media as MediaType).caption : null

  return (
    <div className={cn(enableGutter && 'container', 'my-12', className)}>
      <div className={cn('relative aspect-video rounded-3xl overflow-hidden shadow-2xl', !disableInnerContainer && 'mx-auto')}>
        {media && typeof media === 'object' && (
          <Media resource={media} fill className={cn('object-cover', imgClassName)} />
        )}
      </div>
      {caption && (
        <div className={cn('mt-4 text-center text-sm text-muted-foreground italic', captionClassName)}>
          <RichText data={caption} enableGutter={false} />
        </div>
      )}
    </AnimateOnScroll>
  )
}
