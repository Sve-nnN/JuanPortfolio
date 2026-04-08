import React from 'react'
import type { AdBanner } from '@/payload-types'
import { Media } from '@/components/Media'

interface SidebarBannersBlockType {
  banners?: (string | AdBanner)[] | null
  sticky?: boolean
}

export const SidebarBannersComponent: React.FC<SidebarBannersBlockType> = (props) => {
  const { banners, sticky = true } = props

  const bannerList =
    banners && Array.isArray(banners)
      ? (banners.filter((b) => typeof b === 'object') as AdBanner[])
      : []

  if (bannerList.length === 0) return null

  const stickyClass = sticky ? 'sticky top-24 max-h-[calc(100vh-6rem)] overflow-auto' : ''

  return (
    <aside className="hidden lg:block lg:col-span-4">
      <div className={`space-y-4 ${stickyClass}`}>
        {bannerList.map((banner) => {
          const href = banner.url || '#'
          const openInNewTab = banner.openInNewTab || false

          return (
            <a
              key={banner.id}
              href={href}
              target={openInNewTab ? '_blank' : undefined}
              rel={openInNewTab ? 'noopener noreferrer' : undefined}
              className="block border rounded overflow-hidden hover:shadow-lg transition-shadow"
              aria-label={banner.title || undefined}
            >
              {banner.image && typeof banner.image === 'object' && (
                <Media resource={banner.image} className="w-full h-auto" />
              )}
              {!banner.image && banner.title && (
                <div className="p-4 text-sm font-medium">{banner.title}</div>
              )}
            </a>
          )
        })}
      </div>
    </aside>
  )
}
