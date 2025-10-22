'use client'

import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
// Link and icons not required here

export const HeaderNav: React.FC<{ data: HeaderType; mobile?: boolean }> = ({ data, mobile }) => {
  const navItems = data?.navItems || []

  if (mobile) {
    return (
      <nav className="flex flex-col space-y-3">
        {navItems.map(({ link }, i) => (
          <div key={i}>
            <CMSLink
              {...link}
              className="block text-lg font-medium py-3 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
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
          <CMSLink
            key={i}
            {...link}
            className="text-sm font-medium hover:text-primary transition-colors"
          />
        )
      })}
    </nav>
  )
}
