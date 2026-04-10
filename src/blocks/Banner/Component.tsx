import React from 'react'
import type { BannerBlock as BannerBlockProps } from '@/payload-types'
import { cn } from '@/utilities/ui'
import RichText from '@/components/RichText'

export const BannerBlock: React.FC<BannerBlockProps & { className?: string; locale?: 'en' | 'es' }> = ({
  className,
  content,
  style,
  locale: _locale
}) => {
  return (
    <div className={cn('mx-auto my-8 w-full max-w-[48rem]', className)}>
      <div
        className={cn('border py-3 px-6 flex items-center rounded', {
          'bg-blue-500/10 border-blue-200 text-blue-900': style === 'info',
          'bg-yellow-500/10 border-yellow-200 text-yellow-900': style === 'warning',
          'bg-red-500/10 border-red-200 text-red-900': style === 'error',
          'bg-green-500/10 border-green-200 text-green-900': style === 'success',
        })}
      >
        <RichText data={content} enableGutter={false} />
      </div>
    </div>
  )
}
