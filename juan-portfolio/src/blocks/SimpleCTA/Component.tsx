import React from 'react'
import type { SimpleCtaBlock } from '@/payload-types'
import { CMSLink } from '@/components/Link'

export const SimpleCta: React.FC<SimpleCtaBlock & { locale?: 'en' | 'es' }> = (props) => {
  const { text, label, url, backgroundColor = 'black', locale = 'es' } = props

  const bgColorClass = {
    black: 'bg-black text-white',
    primary: 'bg-primary text-white',
    gray: 'bg-gray-100 dark:bg-gray-800 text-current',
  }[backgroundColor || 'black']

  const buttonClass = {
    black: 'bg-white text-black hover:bg-gray-100',
    primary: 'bg-white text-primary hover:bg-gray-100',
    gray: 'bg-primary text-white hover:bg-blue-700',
  }[backgroundColor || 'black']

  return (
    <section className={`py-12 ${bgColorClass}`}>
      <div className="max-w-4xl mx-auto px-6 text-center">
        {text && <p className="mb-4 text-lg">{text}</p>}
        {label && url && (
          <CMSLink
            url={url}
            label={label}
            locale={locale}
            className={`inline-block px-6 py-3 rounded-lg transition-colors ${buttonClass}`}
          />
        )}
      </div>
    </section>
  )
}
