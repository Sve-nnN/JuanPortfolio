'use client'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import React from 'react'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          ease: 'easeInOut',
          duration: 0.5,
          opacity: { duration: 0.4 },
          y: { duration: 0.5 }
        }}
      >
        {children}
      </m.div>
    </LazyMotion>
  )
}
