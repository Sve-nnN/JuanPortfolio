import { describe, it, expect } from 'vitest'
import { getAnimationVariants, getViewportOptions } from '@/utilities/animationVariants'
import type { AnimationConfig } from '@/fields/animation'

describe('animationVariants utilities', () => {
    describe('getAnimationVariants', () => {
        it('should return empty variants when config is null', () => {
            const variants = getAnimationVariants(null)
            expect(variants).toEqual({})
        })

        it('should return empty variants when enabled is false', () => {
            const config: AnimationConfig = {
                enabled: false,
                type: 'fade',
                direction: 'up',
                duration: 0.6,
                delay: 0,
                easing: 'easeOut',
                staggerChildren: 0,
                viewportAmount: 0.3,
            }
            const variants = getAnimationVariants(config)
            expect(variants).toEqual({})
        })

        describe('Fade animation', () => {
            it('should generate fade animation with default values', () => {
                const config: AnimationConfig = {
                    enabled: true,
                    type: 'fade',
                    direction: 'up',
                    duration: 0.6,
                    delay: 0,
                    easing: 'easeOut',
                    staggerChildren: 0,
                    viewportAmount: 0.3,
                }

                const variants = getAnimationVariants(config)

                expect(variants).toHaveProperty('hidden')
                expect(variants).toHaveProperty('visible')
                expect(variants.hidden).toHaveProperty('opacity', 0)
                expect(variants.visible).toHaveProperty('opacity', 1)
            })
        })

        describe('Slide animation', () => {
            it('should generate slide up animation', () => {
                const config: AnimationConfig = {
                    enabled: true,
                    type: 'slide',
                    direction: 'up',
                    duration: 0.6,
                    delay: 0,
                    easing: 'easeOut',
                    staggerChildren: 0,
                    viewportAmount: 0.3,
                }

                const variants = getAnimationVariants(config)

                expect(variants.hidden).toHaveProperty('y')
                expect(variants.hidden).toHaveProperty('opacity', 0)
                expect(variants.visible).toHaveProperty('y', 0)
                expect(variants.visible).toHaveProperty('opacity', 1)
            })

            it('should generate slide down animation', () => {
                const config: AnimationConfig = {
                    enabled: true,
                    type: 'slide',
                    direction: 'down',
                    duration: 0.6,
                    delay: 0,
                    easing: 'easeOut',
                    staggerChildren: 0,
                    viewportAmount: 0.3,
                }

                const variants = getAnimationVariants(config)

                expect(variants.hidden).toHaveProperty('y')
                expect(variants.visible).toHaveProperty('y', 0)
            })

            it('should generate slide left animation', () => {
                const config: AnimationConfig = {
                    enabled: true,
                    type: 'slide',
                    direction: 'left',
                    duration: 0.6,
                    delay: 0,
                    easing: 'easeOut',
                    staggerChildren: 0,
                    viewportAmount: 0.3,
                }

                const variants = getAnimationVariants(config)

                expect(variants.hidden).toHaveProperty('x')
                expect(variants.visible).toHaveProperty('x', 0)
            })

            it('should generate slide right animation', () => {
                const config: AnimationConfig = {
                    enabled: true,
                    type: 'slide',
                    direction: 'right',
                    duration: 0.6,
                    delay: 0,
                    easing: 'easeOut',
                    staggerChildren: 0,
                    viewportAmount: 0.3,
                }

                const variants = getAnimationVariants(config)

                expect(variants.hidden).toHaveProperty('x')
                expect(variants.visible).toHaveProperty('x', 0)
            })
        })

        describe('Scale animation', () => {
            it('should generate scale animation', () => {
                const config: AnimationConfig = {
                    enabled: true,
                    type: 'scale',
                    direction: 'up',
                    duration: 0.6,
                    delay: 0,
                    easing: 'easeOut',
                    staggerChildren: 0,
                    viewportAmount: 0.3,
                }

                const variants = getAnimationVariants(config)

                expect(variants.hidden).toHaveProperty('scale', 0.8)
                expect(variants.hidden).toHaveProperty('opacity', 0)
                expect(variants.visible).toHaveProperty('scale', 1)
                expect(variants.visible).toHaveProperty('opacity', 1)
            })
        })

        describe('Rotate animation', () => {
            it('should generate rotate animation', () => {
                const config: AnimationConfig = {
                    enabled: true,
                    type: 'rotate',
                    direction: 'up',
                    duration: 0.6,
                    delay: 0,
                    easing: 'easeOut',
                    staggerChildren: 0,
                    viewportAmount: 0.3,
                }

                const variants = getAnimationVariants(config)

                expect(variants.hidden).toHaveProperty('rotate')
                expect(variants.hidden).toHaveProperty('opacity', 0)
                expect(variants.visible).toHaveProperty('rotate', 0)
                expect(variants.visible).toHaveProperty('opacity', 1)
            })
        })

        describe('Bounce animation', () => {
            it('should generate bounce animation with spring transition', () => {
                const config: AnimationConfig = {
                    enabled: true,
                    type: 'bounce',
                    direction: 'up',
                    duration: 0.6,
                    delay: 0,
                    easing: 'easeOut',
                    staggerChildren: 0,
                    viewportAmount: 0.3,
                }

                const variants = getAnimationVariants(config)

                expect(variants.hidden).toHaveProperty('y')
                expect(variants.hidden).toHaveProperty('opacity', 0)
                expect(variants.visible).toHaveProperty('y', 0)
                expect(variants.visible).toHaveProperty('opacity', 1)
                expect(variants.visible?.transition).toHaveProperty('type', 'spring')
            })
        })

        describe('Transition properties', () => {
            it('should apply custom duration', () => {
                const config: AnimationConfig = {
                    enabled: true,
                    type: 'fade',
                    direction: 'up',
                    duration: 1.2,
                    delay: 0,
                    easing: 'easeOut',
                    staggerChildren: 0,
                    viewportAmount: 0.3,
                }

                const variants = getAnimationVariants(config)

                expect(variants.visible?.transition).toHaveProperty('duration', 1.2)
            })

            it('should apply custom delay', () => {
                const config: AnimationConfig = {
                    enabled: true,
                    type: 'fade',
                    direction: 'up',
                    duration: 0.6,
                    delay: 0.5,
                    easing: 'easeOut',
                    staggerChildren: 0,
                    viewportAmount: 0.3,
                }

                const variants = getAnimationVariants(config)

                expect(variants.visible?.transition).toHaveProperty('delay', 0.5)
            })

            it('should apply staggerChildren when > 0', () => {
                const config: AnimationConfig = {
                    enabled: true,
                    type: 'fade',
                    direction: 'up',
                    duration: 0.6,
                    delay: 0,
                    easing: 'easeOut',
                    staggerChildren: 0.1,
                    viewportAmount: 0.3,
                }

                const variants = getAnimationVariants(config)

                expect(variants.visible?.transition).toHaveProperty('staggerChildren', 0.1)
            })

            it('should not apply staggerChildren when 0', () => {
                const config: AnimationConfig = {
                    enabled: true,
                    type: 'fade',
                    direction: 'up',
                    duration: 0.6,
                    delay: 0,
                    easing: 'easeOut',
                    staggerChildren: 0,
                    viewportAmount: 0.3,
                }

                const variants = getAnimationVariants(config)

                expect(variants.visible?.transition).not.toHaveProperty('staggerChildren')
            })
        })

        describe('Easing functions', () => {
            const easings: Array<AnimationConfig['easing']> = [
                'ease',
                'easeIn',
                'easeOut',
                'easeInOut',
                'linear',
            ]

            easings.forEach((easing) => {
                it(`should apply ${easing} easing`, () => {
                    const config: AnimationConfig = {
                        enabled: true,
                        type: 'fade',
                        direction: 'up',
                        duration: 0.6,
                        delay: 0,
                        easing,
                        staggerChildren: 0,
                        viewportAmount: 0.3,
                    }

                    const variants = getAnimationVariants(config)

                    expect(variants.visible?.transition).toHaveProperty('ease')
                })
            })
        })

        describe('Null handling', () => {
            it('should handle null duration', () => {
                const config: AnimationConfig = {
                    enabled: true,
                    type: 'fade',
                    direction: 'up',
                    duration: null,
                    delay: 0,
                    easing: 'easeOut',
                    staggerChildren: 0,
                    viewportAmount: 0.3,
                }

                const variants = getAnimationVariants(config)

                expect(variants.visible?.transition).toHaveProperty('duration', 0.6)
            })

            it('should handle null delay', () => {
                const config: AnimationConfig = {
                    enabled: true,
                    type: 'fade',
                    direction: 'up',
                    duration: 0.6,
                    delay: null,
                    easing: 'easeOut',
                    staggerChildren: 0,
                    viewportAmount: 0.3,
                }

                const variants = getAnimationVariants(config)

                expect(variants.visible?.transition).toHaveProperty('delay', 0)
            })

            it('should handle null easing', () => {
                const config: AnimationConfig = {
                    enabled: true,
                    type: 'fade',
                    direction: 'up',
                    duration: 0.6,
                    delay: 0,
                    easing: null,
                    staggerChildren: 0,
                    viewportAmount: 0.3,
                }

                const variants = getAnimationVariants(config)

                expect(variants.visible?.transition).toHaveProperty('ease')
            })
        })
    })

    describe('getViewportOptions', () => {
        it('should return default viewport options when config is null', () => {
            const options = getViewportOptions(null)

            expect(options).toEqual({
                once: true,
                amount: 0.3,
            })
        })

        it('should use custom viewportAmount', () => {
            const config: AnimationConfig = {
                enabled: true,
                type: 'fade',
                direction: 'up',
                duration: 0.6,
                delay: 0,
                easing: 'easeOut',
                staggerChildren: 0,
                viewportAmount: 0.5,
            }

            const options = getViewportOptions(config)

            expect(options).toEqual({
                once: true,
                amount: 0.5,
            })
        })

        it('should handle null viewportAmount', () => {
            const config: AnimationConfig = {
                enabled: true,
                type: 'fade',
                direction: 'up',
                duration: 0.6,
                delay: 0,
                easing: 'easeOut',
                staggerChildren: 0,
                viewportAmount: null,
            }

            const options = getViewportOptions(config)

            expect(options).toEqual({
                once: true,
                amount: 0.3,
            })
        })

        it('should always set once to true', () => {
            const config: AnimationConfig = {
                enabled: true,
                type: 'fade',
                direction: 'up',
                duration: 0.6,
                delay: 0,
                easing: 'easeOut',
                staggerChildren: 0,
                viewportAmount: 0.8,
            }

            const options = getViewportOptions(config)

            expect(options.once).toBe(true)
        })
    })
})
