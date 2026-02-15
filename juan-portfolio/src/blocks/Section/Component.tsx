import React from 'react'
import type { SectionBlock as SectionBlockProps } from '@/payload-types'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { cn } from '@/utilities/ui'
import { Media } from '@/components/Media'

export const SectionBlock: React.FC<SectionBlockProps & { locale?: 'en' | 'es' }> = ({
  blocks,
  container = 'container',
  paddingY = 'md',
  backgroundStyle = 'none',
  backgroundColor = 'bg-transparent',
  backgroundMedia,
  anchorId,
  className,
  locale
}) => {
  const paddingClasses = {
    none: 'py-0',
    sm: 'py-12 md:py-20',
    md: 'py-20 md:py-32',
    lg: 'py-32 md:py-48',
  }

  return (
    <section 
      id={anchorId || undefined}
      className={cn(
        'relative overflow-hidden',
        paddingClasses[paddingY!],
        backgroundStyle === 'color' && backgroundColor,
        className
      )}
    >
      {backgroundStyle === 'image' && backgroundMedia && typeof backgroundMedia === 'object' && (
        <div className="absolute inset-0 -z-10">
          <Media resource={backgroundMedia} fill className="object-cover" />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        </div>
      )}

      <div className={cn(container === 'container' ? 'container mx-auto px-4' : 'w-full')}>
        {blocks && (
          <RenderBlocks blocks={blocks} locale={locale} />
        )}
      </div>
    </section>
  )
}
