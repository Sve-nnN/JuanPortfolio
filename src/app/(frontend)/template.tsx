'use client'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import React from 'react'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        // Transform-only entrance. This template wraps every page, so an
        // opacity:0 initial rendered the whole page (including the LCP hero)
        // invisible in the SSR HTML until Framer Motion hydrated (~3s on slow
        // mobile) — that was the real LCP gate (~8s). A translateY slide keeps a
        // subtle page transition while painting content on first paint; opacity
        // defaults to 1 so nothing is hidden. CWV milestone v1.1.
        initial={{ y: 8 }}
        animate={{ y: 0 }}
        transition={{ ease: 'easeInOut', duration: 0.5 }}
      >
        {children}
      </m.div>
    </LazyMotion>
  )
}
