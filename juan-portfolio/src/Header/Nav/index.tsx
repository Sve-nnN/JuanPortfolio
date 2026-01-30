'use client'

import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
// Link and icons not required here

type Props = { data: HeaderType; mobile?: boolean; onItemClick?: () => void }

export const HeaderNav: React.FC<Props> = ({ data, mobile, onItemClick }) => {
  const navItems = data?.navItems || []

  if (mobile) {
    return (
      <nav className="flex flex-col space-y-3">
        {navItems.map(({ link }, i) => (
          <div key={i}>
            <CMSLink
              {...link}
              className="block text-lg font-medium py-3 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-black dark:text-white"
              onClick={onItemClick}
            />
          </div>
        ))}
      </nav>
    )
  }

  return (
    <nav className="hidden md:flex items-center space-x-8">
      {navItems.map(({ link }, i) => {
        return (
          <div key={i} className="relative group">
            <CMSLink
              {...link}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1"
            />
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
          </div>
        )
      })}
    </nav>
  )
}
