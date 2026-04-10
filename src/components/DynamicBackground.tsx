'use client'

import React from 'react'
import { motion } from 'framer-motion'

export const DynamicBackground: React.FC<{ color?: string | null }> = ({ color }) => {
  // Use a fallback color if none provided to keep the DOM nodes stable
  const activeColor = color || 'transparent'

  return (
    <div 
      className="fixed inset-0 -z-50 overflow-hidden pointer-events-none"
      aria-hidden="true"
      style={{ 
        contain: 'strict',
        backfaceVisibility: 'hidden',
        perspective: '1000px'
      }}
    >
      {/* 
        Primary Blob - Uses transform instead of top/left for absolute stability.
        Always rendered to avoid DOM injection shifts.
      */}
      <motion.div
        animate={{
          opacity: color ? [0.15, 0.25, 0.15] : 0,
          scale: [1, 1.15, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute w-[80vw] h-[80vw] rounded-full blur-[120px] will-change-transform"
        style={{ 
          backgroundColor: activeColor,
          top: '-20%',
          left: '-20%',
          transform: 'translate3d(0,0,0)'
        }}
      />
      
      {/* Secondary Blob */}
      <motion.div
        animate={{
          opacity: color ? [0.1, 0.2, 0.1] : 0,
          scale: [1.1, 1, 1.1],
          rotate: [0, -90, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute w-[70vw] h-[70vw] rounded-full blur-[120px] will-change-transform"
        style={{ 
          backgroundColor: activeColor,
          bottom: '-15%',
          right: '-15%',
          transform: 'translate3d(0,0,0)'
        }}
      />
    </div>
  )
}
