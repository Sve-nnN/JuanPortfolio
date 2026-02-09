'use client'
import React from 'react'
import { motion } from 'framer-motion'
import type { Header as HeaderType } from '@/payload-types'
import { CMSLink } from '@/components/Link'

type Props = { data: HeaderType; mobile?: boolean; onItemClick?: () => void }

export const HeaderNav: React.FC<Props> = ({ data, mobile, onItemClick }) => {
  const navItems = data?.navItems || []

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0 },
  }

  if (mobile) {
    return (
      <motion.nav 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col space-y-2"
      >
        {navItems.map(({ link }, i) => (
          <motion.div key={i} variants={itemVariants}>
            <CMSLink
              {...link}
              className="block text-3xl font-bold font-array py-4 transition-all active:pl-4 text-foreground hover:text-primary border-b border-border/50"
              onClick={onItemClick}
            />
          </motion.div>
        ))}
      </motion.nav>
    )
  }

  return (
    <nav className="flex items-center space-x-1">
      {navItems.map(({ link }, i) => {
        return (
          <div key={i} className="relative px-4 py-2 group">
            <CMSLink
              {...link}
              className="text-sm font-semibold text-foreground/70 group-hover:text-foreground transition-colors relative z-10"
            />
            <motion.span
              layoutId="nav-pill"
              className="absolute inset-0 bg-secondary/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              initial={false}
            />
          </div>
        )
      })}
    </nav>
  )
}
