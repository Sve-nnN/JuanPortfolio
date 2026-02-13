'use client'

import React, { useState, useEffect } from 'react'
import { domAnimation, LazyMotion, m, useInView } from 'framer-motion'
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
  const ref = React.useRef(null)
  const isInView = useInView(ref, getViewportOptions(config))

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // If animations are explicitly disabled, or not mounted, or reduced motion, just render children
  if (config?.enabled === false || !isMounted) {
    return <div className={className} ref={ref}>{children}</div>
  }

  // Respect reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  const variants = getAnimationVariants(config)
  const MotionComponent = m[as] as React.ElementType

  return (
    <LazyMotion features={domAnimation}>
      <MotionComponent
        ref={ref}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={variants}
        className={className}
      >
        {children}
      </MotionComponent>
    </LazyMotion>
  )
}
