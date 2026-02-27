'use client'

import React, { useState, useEffect } from 'react'
import { domAnimation, LazyMotion, m } from 'framer-motion'
import type { AnimationConfig } from '@/fields/animation'
import { getAnimationVariants, getViewportOptions } from '@/utilities/animationVariants'

interface AnimateOnScrollProps {
  children: React.ReactNode
  config?: AnimationConfig
  className?: string
  as?: keyof typeof m
}

export function AnimateOnScroll({ children, config, className, as = 'div' }: AnimateOnScrollProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Respect reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // If animations are explicitly disabled, or not mounted, or reduced motion, just render children
  if (config?.enabled === false || !isMounted || prefersReducedMotion) {
    return React.createElement(as as string, { className }, children)
  }

  const variants = getAnimationVariants(config)
  // Added comment to force Hot Module Replacement (HMR) to clear the webpack cache for this file
  const MotionComponent = m[as] as React.ElementType

  return (
    <LazyMotion features={domAnimation}>
      <MotionComponent
        initial="hidden"
        whileInView="visible"
        viewport={{ ...getViewportOptions(config), margin: '0px 0px 500px 0px' }}
        variants={variants}
        className={className}
      >
        {children}
      </MotionComponent>
    </LazyMotion>
  )
}
