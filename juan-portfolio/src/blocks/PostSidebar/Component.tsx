import React from 'react'
import { Media } from '@/components/Media'
import type { PostSidebarBlock, AdBanner } from '@/payload-types'

export const PostSidebarBlock: React.FC<PostSidebarBlock> = (props) => {
  const { banners, sticky = true } = props

  const displayBanners =
    banners && Array.isArray(banners)
      ? (banners.filter((b) => typeof b === 'object') as AdBanner[])
      : []

  if (displayBanners.length === 0) return null

  return (
    <aside className="space-y-4">
      <div className={sticky ? 'sticky top-24 max-h-[calc(100vh-6rem)] overflow-auto' : ''}>
        {displayBanners.map((banner) => {
          const href = banner.url || '#'
          const newTab = banner.openInNewTab || false
          const title = banner.title || ''

          return (
            <a
              key={banner.id}
              href={href}
              target={newTab ? '_blank' : undefined}
              rel={newTab ? 'noopener noreferrer' : undefined}
              className="block border rounded overflow-hidden hover:shadow-lg transition-shadow mb-4"
              aria-label={title || undefined}
            >
              {banner.image && typeof banner.image === 'object' && (
                <Media resource={banner.image} className="w-full h-auto" />
              )}
              {!banner.image && title && <div className="p-4 text-sm font-medium">{title}</div>}
            </a>
          )
        })}
      </div>
    </aside>
  )
}
