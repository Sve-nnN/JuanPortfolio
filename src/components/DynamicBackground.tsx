'use client'

import React from 'react'

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
        Primary Blob - CSS animation (compositor thread, zero INP impact).
        Always rendered to avoid DOM injection shifts.
      */}
      <div
        className={`absolute w-[80vw] h-[80vw] rounded-full blur-[120px] will-change-transform ${color ? 'animate-blob-primary' : ''}`}
        style={{
          backgroundColor: activeColor,
          top: '-20%',
          left: '-20%',
          transform: 'translate3d(0,0,0)',
          opacity: color ? undefined : 0
        }}
      />

      {/* Secondary Blob */}
      <div
        className={`absolute w-[70vw] h-[70vw] rounded-full blur-[120px] will-change-transform ${color ? 'animate-blob-secondary' : ''}`}
        style={{
          backgroundColor: activeColor,
          bottom: '-15%',
          right: '-15%',
          transform: 'translate3d(0,0,0)',
          opacity: color ? undefined : 0
        }}
      />
    </div>
  )
}
