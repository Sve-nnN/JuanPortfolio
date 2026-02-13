import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import React from 'react'

import type { Page, Post } from '@/payload-types'
import { getPostUrl } from '@/utilities/getPostUrl'

type CMSLinkType = {
  appearance?: 'inline' | ButtonProps['variant']
  children?: React.ReactNode
  className?: string
  label?: string | null
  newTab?: boolean | null
  reference?: {
    relationTo: 'pages' | 'posts'
    value: Page | Post | string | number
  } | null
  size?: ButtonProps['size'] | null
  type?: 'custom' | 'reference' | null
  url?: string | null
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
  locale?: 'en' | 'es'
}

export const CMSLink: React.FC<CMSLinkType> = (props) => {
  const {
    type,
    appearance = 'inline',
    children,
    className,
    label,
    newTab,
    reference,
    size: sizeFromProps,
    url,
    onClick,
    locale = 'es',
  } = props

  const localePrefix = locale === 'es' ? '' : '/en'

  // Resolve href consistently with site routes
  const href: string | null = (() => {
    if (type === 'reference' && reference?.value && typeof reference.value === 'object') {
      const value = reference.value
      const slug = (value as { slug?: string }).slug || ''
      if (!slug) return null
      // Posts use /blog/{category}/[slug]; pages use /[slug]
      if (reference.relationTo === 'posts') {
        return getPostUrl(value as Post, locale)
      }
      if (reference.relationTo as string === 'categories') {
        return `${localePrefix}/blog/${slug}`
      }
      if (reference.relationTo as string === 'case-studies') {
        return `${localePrefix}/case-studies/${slug}`
      }
      return `${localePrefix}/${slug === 'home' ? '' : slug}`
    }
    if (url) return url
    return null
  })()

  if (!href) return null

  // Derive label if not provided
  const derivedLabel: string | undefined = (() => {
    if (label && typeof label === 'string') return label
    if (type === 'reference' && reference?.value && typeof reference.value === 'object') {
      const title = (reference.value as { title?: string }).title
      if (title) return title
    }
    try {
      const path = href.split('?')[0]
      const seg = path.split('/').filter(Boolean).pop()
      return seg ? decodeURIComponent(seg).replace(/-/g, ' ') : undefined
    } catch {
      return undefined
    }
  })()

  const size = appearance === 'link' ? 'clear' : sizeFromProps
  const newTabProps = newTab ? { rel: 'noopener noreferrer', target: '_blank' } : {}

  /* Ensure we don't break any styles set by richText */
  if (appearance === 'inline') {
    return (
      <Link
        className={cn(
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm transition-colors hover:text-primary',
          className
        )}
        href={href}
        aria-label={derivedLabel}
        {...newTabProps}
        onClick={onClick}
      >
        {derivedLabel}
        {children}
      </Link>
    )
  }

  return (
    <Button asChild className={className} size={size} variant={appearance}>
      <Link
        className={cn(className)}
        href={href}
        aria-label={derivedLabel}
        {...newTabProps}
        onClick={onClick}
      >
        {derivedLabel}
        {children}
      </Link>
    </Button>
  )
}
