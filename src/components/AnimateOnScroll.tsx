'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { m } from 'framer-motion'
import type { AnimationConfig } from '@/fields/animation'
import { getAnimationVariants, getViewportOptions } from '@/utilities/animationVariants'

interface AnimateOnScrollProps {
  children: React.ReactNode
  config?: AnimationConfig
  className?: string
  as?: keyof typeof m
}

export function AnimateOnScroll({ children, config, className, as = 'div' }: AnimateOnScrollProps) {
  // Check prefers-reduced-motion on mount only (avoid every render)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mediaQuery.matches)
    }
  }, [])

  // If animations are explicitly disabled or reduced motion, just render children
  if (config?.enabled === false || prefersReducedMotion) {
    return React.createElement(as as string, { className }, children)
  }

  const variants = getAnimationVariants(config)
  const MotionComponent = m[as] as React.ElementType

  return (
    <MotionComponent
      initial={false}
      whileInView="visible"
      viewport={{ ...getViewportOptions(config), margin: '0px 0px 500px 0px' }}
      variants={variants}
      className={className}
    >
      {children}
    </MotionComponent>
  )
}
