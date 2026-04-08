import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnimateOnScroll } from '@/components/AnimateOnScroll'
import type { AnimationConfig } from '@/fields/animation'

describe('AnimateOnScroll', () => {
    // Mock IntersectionObserver for useInView
    let mockIntersectionObserver: any

    beforeEach(() => {
        const mockElement = document.createElement('div');
        mockIntersectionObserver = vi.fn(function (this: any, callback: IntersectionObserverCallback) {
            this.observe = vi.fn()
            this.unobserve = vi.fn()
            this.disconnect = vi.fn()
            // Simulate element in view
            setTimeout(() => {
                callback([{ isIntersecting: true, target: mockElement } as IntersectionObserverEntry], this)
            }, 0)
        })
        global.IntersectionObserver = mockIntersectionObserver as any

        // Mock matchMedia for all tests in this suite
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation((query) => ({
                matches: false, // Default to no reduced motion
                media: query,
                onchange: null,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('Disabled state', () => {
        it('should render plain div when config is null', () => {
            render(
                <AnimateOnScroll config={undefined}>
                    <div data-testid="child">Test Content</div>
                </AnimateOnScroll>,
            )

            expect(screen.getByTestId('child')).toBeInTheDocument()
            expect(screen.getByTestId('child').parentElement?.tagName).toBe('DIV')
        })

        it('should render plain div when enabled is false', () => {
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

            render(
                <AnimateOnScroll config={config}>
                    <div data-testid="child">Test Content</div>
                </AnimateOnScroll>,
            )

            expect(screen.getByTestId('child')).toBeInTheDocument()
            expect(screen.getByTestId('child').parentElement?.tagName).toBe('DIV')
        })
    })

    describe('Prefers reduced motion', () => {
        it('should render plain div when user prefers reduced motion', () => {
            // Override mock for this specific test
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: vi.fn().mockImplementation((query) => ({
                    matches: query === '(prefers-reduced-motion: reduce)',
                    media: query,
                    onchange: null,
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn(),
                    dispatchEvent: vi.fn(),
                })),
            })

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

            render(
                <AnimateOnScroll config={config}>
                    <div data-testid="child">Test Content</div>
                </AnimateOnScroll>,
            )

            expect(screen.getByTestId('child')).toBeInTheDocument()
            expect(screen.getByTestId('child').parentElement?.tagName).toBe('DIV')
        })
    })

    describe('Enabled animations', () => {
        it('should render motion.div when enabled', () => {
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

            const { container } = render(
                <AnimateOnScroll config={config}>
                    <div data-testid="child">Test Content</div>
                </AnimateOnScroll>,
            )

            expect(screen.getByTestId('child')).toBeInTheDocument()
            // Motion div should exist
            expect(container.firstChild).toBeTruthy()
        })

        it('should apply custom className', () => {
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

            const { container } = render(
                <AnimateOnScroll config={config} className="custom-class">
                    <div data-testid="child">Test Content</div>
                </AnimateOnScroll>,
            )

            expect(container.firstChild).toHaveClass('custom-class')
        })

        it('should render with different html elements', () => {
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

            const { container } = render(
                <AnimateOnScroll config={config} as="section">
                    <div data-testid="child">Test Content</div>
                </AnimateOnScroll>,
            )

            expect(container.firstChild?.nodeName).toBe('SECTION')
        })
    })

    describe('Children rendering', () => {
        it('should render children correctly', () => {
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

            render(
                <AnimateOnScroll config={config}>
                    <div data-testid="child-1">Child 1</div>
                    <div data-testid="child-2">Child 2</div>
                </AnimateOnScroll>,
            )

            expect(screen.getByTestId('child-1')).toHaveTextContent('Child 1')
            expect(screen.getByTestId('child-2')).toHaveTextContent('Child 2')
        })
    })

    describe('Animation types', () => {
        const animationTypes: Array<AnimationConfig['type']> = [
            'fade',
            'slide',
            'scale',
            'rotate',
            'bounce',
        ]

        animationTypes.forEach((type) => {
            it(`should handle ${type} animation type`, () => {
                const config: AnimationConfig = {
                    enabled: true,
                    type,
                    direction: 'up',
                    duration: 0.6,
                    delay: 0,
                    easing: 'easeOut',
                    staggerChildren: 0,
                    viewportAmount: 0.3,
                }

                render(
                    <AnimateOnScroll config={config}>
                        <div data-testid="child">Test</div>
                    </AnimateOnScroll>,
                )

                expect(screen.getByTestId('child')).toBeInTheDocument()
            })
        })
    })

    describe('Stagger children', () => {
        it('should accept staggerChildren config', () => {
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

            render(
                <AnimateOnScroll config={config}>
                    <div data-testid="child-1">Child 1</div>
                    <div data-testid="child-2">Child 2</div>
                    <div data-testid="child-3">Child 3</div>
                </AnimateOnScroll>,
            )

            expect(screen.getByTestId('child-1')).toBeInTheDocument()
            expect(screen.getByTestId('child-2')).toBeInTheDocument()
            expect(screen.getByTestId('child-3')).toBeInTheDocument()
        })
    })
})