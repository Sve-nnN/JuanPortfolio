import React from 'react'
import type { Media as PayloadMedia } from '@/payload-types'

interface MediaProps {
  resource: string | PayloadMedia
  className?: string
  htmlElement?: null | undefined
  size?: string
}

export const Media: React.FC<MediaProps> = ({ resource, className }) => {
  if (typeof resource === 'string') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={resource} className={className} alt="" />
  }

  const url = resource.url || ''
  const alt = resource.alt || ''

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} className={className} alt={alt} />
}

export default Media
