"use client"
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { getServerSideURL } from '@/utilities/getURL'

type Props = {
  media?: any
}

export default function HeroMedia({ media }: Props) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    if (!media) return
    if (typeof media === 'string') {
      // assume id
      setSrc(`/api/uploads/${media}`)
      return
    }
    if (typeof media === 'object') {
      if ('url' in media && media.url) {
        setSrc(media.url)
        return
      }
      if ('path' in media && media.path) {
        setSrc(media.path)
        return
      }
    }
  }, [media])

  if (!src) return null

  // ensure absolute url when needed
  const finalSrc = src.startsWith('http') ? src : getServerSideURL().replace(/\/$/, '') + src

  return (
    <div className="relative rounded-full p-1 shadow-2xl">
      <div className="rounded-full overflow-hidden w-72 h-72 md:w-96 md:h-96 bg-card border-8 border-white dark:border-card-dark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={finalSrc} alt={(media && typeof media === 'object' && (media.alt || '')) || ''} className="object-cover rounded-full w-full h-full" />
      </div>
    </div>
  )
}
