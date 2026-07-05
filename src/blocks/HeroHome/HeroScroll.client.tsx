'use client'

import React, { useEffect, useRef } from 'react'

/**
 * Minimal scroll-parallax driver for the home hero.
 *
 * Phase 39 (CWV v1.7): replaces framer-motion's `useScroll`/`useTransform` in the
 * hero. It writes `window.scrollY` to the `--sy` custom property (rAF-throttled)
 * on the hero `<section>`; the actual transforms live in CSS (see globals.css
 * `.hero-backdrop/.hero-text/.hero-media`). This keeps framer-motion out of the
 * above-the-fold bundle and lets the hero render as a server component — only
 * this tiny wrapper is client-side.
 *
 * Before hydration `--sy` is unset, so CSS falls back to 0 (identity transform)
 * and the first paint matches the SSR HTML. Honors `prefers-reduced-motion`.
 */
export const HeroScroll: React.FC<{
  children: React.ReactNode
  className?: string
  id?: string
}> = ({ children, className, id }) => {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    let raf = 0
    const update = () => {
      raf = 0
      el.style.setProperty('--sy', String(window.scrollY))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section ref={ref} className={className} id={id}>
      {children}
    </section>
  )
}
