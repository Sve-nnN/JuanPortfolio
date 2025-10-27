import React from 'react'

import { RenderBlocks } from '@/blocks/RenderBlocks'

type BgMedia = { url?: string }

type Block = {
  blockType?: string
  [key: string]: unknown
}

type Props = {
  container?: 'container' | 'full'
  paddingY?: 'none' | 'sm' | 'md' | 'lg'
  backgroundStyle?: 'none' | 'color' | 'image'
  backgroundColor?: string
  backgroundMedia?: BgMedia | number | null
  anchorId?: string
  className?: string
  blocks?: Block[]
}

const paddingMap: Record<NonNullable<Props['paddingY']>, string> = {
  none: 'py-0',
  sm: 'py-8 md:py-10',
  md: 'py-12 md:py-16',
  lg: 'py-20 md:py-28',
}

export const SectionBlock: React.FC<Props> = ({
  container = 'container',
  paddingY = 'md',
  backgroundStyle = 'none',
  backgroundColor = 'bg-transparent',
  backgroundMedia,
  anchorId,
  className,
  blocks = [],
}) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const py = paddingMap[paddingY]
    const base = `${py} ${className || ''}`.trim()

    if (
      backgroundStyle === 'image' &&
      backgroundMedia &&
      typeof backgroundMedia === 'object' &&
      backgroundMedia.url
    ) {
      return (
        <section id={anchorId} className={`${base} relative`}>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundMedia.url})` }}
            aria-hidden
          />
          <div className="relative">{children}</div>
        </section>
      )
    }

    const bgClass = backgroundStyle === 'color' ? backgroundColor : ''
    return (
      <section id={anchorId} className={`${base} ${bgClass}`.trim()}>
        {children}
      </section>
    )
  }

  return (
    <Wrapper>
      <div className={container === 'container' ? 'container mx-auto px-4 sm:px-6 lg:px-8' : ''}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <RenderBlocks blocks={blocks as any} />
      </div>
    </Wrapper>
  )
}

export default SectionBlock
