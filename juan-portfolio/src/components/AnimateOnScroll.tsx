'use client'

import React from 'react'
import { motion, useInView } from 'framer-motion'
import type { AnimationConfig } from '@/fields/animation'
import { getAnimationVariants, getViewportOptions } from '@/utilities/animationVariants'

interface AnimateOnScrollProps {
    children: React.ReactNode
    config?: AnimationConfig
    className?: string
    as?: keyof typeof motion
}

export function AnimateOnScroll({
    children,
    config,
    className,
    as = 'div',
}: AnimateOnScrollProps) {
    const ref = React.useRef(null)
    const isInView = useInView(ref, getViewportOptions(config))

    // If animations are explicitly disabled, just render children
    if (config?.enabled === false) {
        return <div className={className}>{children}</div>
    }

    // Respect reduced motion preference
    const prefersReducedMotion =
        typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
        return <div className={className}>{children}</div>
    }

    const variants = getAnimationVariants(config)
    const MotionComponent = motion[as] as React.ElementType

    return (
        <MotionComponent
            ref={ref}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={variants}
            className={className}
        >
            {children}
        </MotionComponent>
    )
}
