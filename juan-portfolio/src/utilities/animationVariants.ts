import type { Variants } from 'framer-motion'
import type { AnimationConfig } from '@/fields/animation'

// Easing curves mapping - using Framer Motion easing strings
const easingMap = {
    ease: 'easeInOut',
    easeIn: 'easeIn',
    easeOut: 'easeOut',
    easeInOut: 'easeInOut',
    linear: 'linear',
} as const

// Generate animation variants based on config
export function getAnimationVariants(config?: AnimationConfig | null): Variants {
    if (!config?.enabled) {
        return {}
    }

    const {
        type = 'fade',
        direction = 'up',
        duration = 0.6,
        delay = 0,
        easing = 'easeOut',
        staggerChildren = 0,
    } = config

    const transition = {
        duration: duration ?? 0.6,
        delay: delay ?? 0,
        ease: easingMap[easing ?? 'easeOut'] || easingMap.easeOut,
    }

    const staggerTransition = (staggerChildren ?? 0) > 0 ? { staggerChildren: staggerChildren! } : {}

    // Base variants
    const variants: Variants = {
        hidden: {},
        visible: {
            transition: {
                ...transition,
                ...staggerTransition,
            },
        },
    }

    // Fade animations
    if (type === 'fade') {
        variants.hidden = { opacity: 0 }
        variants.visible = { ...variants.visible, opacity: 1 }
    }

    // Slide animations
    if (type === 'slide') {
        const offset = 50
        variants.hidden = { opacity: 0 }
        variants.visible = { ...variants.visible, opacity: 1 }

        switch (direction) {
            case 'up':
                variants.hidden = { ...variants.hidden, y: offset }
                variants.visible = { ...variants.visible, y: 0 }
                break
            case 'down':
                variants.hidden = { ...variants.hidden, y: -offset }
                variants.visible = { ...variants.visible, y: 0 }
                break
            case 'left':
                variants.hidden = { ...variants.hidden, x: offset }
                variants.visible = { ...variants.visible, x: 0 }
                break
            case 'right':
                variants.hidden = { ...variants.hidden, x: -offset }
                variants.visible = { ...variants.visible, x: 0 }
                break
        }
    }

    // Scale animations
    if (type === 'scale') {
        variants.hidden = { opacity: 0, scale: 0.8 }
        variants.visible = { ...variants.visible, opacity: 1, scale: 1 }
    }

    // Rotate animations
    if (type === 'rotate') {
        variants.hidden = { opacity: 0, rotate: -10, scale: 0.95 }
        variants.visible = { ...variants.visible, opacity: 1, rotate: 0, scale: 1 }
    }

    // Bounce animations
    if (type === 'bounce') {
        variants.hidden = { opacity: 0, y: 30, scale: 0.9 }
        variants.visible = {
            ...variants.visible,
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                ...transition,
                type: 'spring',
                stiffness: 300,
                damping: 20,
                ...staggerTransition,
            },
        }
    }

    return variants
}

// Viewport options based on config
export function getViewportOptions(config?: AnimationConfig | null) {
    const viewportAmount = config?.viewportAmount ?? 0.3

    return {
        once: true, // Only animate once for better performance
        amount: viewportAmount,
    }
}
