'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface SGEAtomicAnswerProps {
  summary: string
  locale?: 'en' | 'es'
  className?: string
}

/**
 * SGEAtomicAnswer Component
 * 
 * Provides a highly citable, structured summary block designed for 
 * Google's Search Generative Experience (SGE) and other LLMs.
 */
export const SGEAtomicAnswer: React.FC<SGEAtomicAnswerProps> = ({ 
  summary, 
  locale = 'es',
  className = ''
}) => {
  if (!summary) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className={`relative mt-8 p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 border-l-primary border-l-4 shadow-2xl ${className}`}
    >
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-widest font-bold text-primary mb-1">
          {locale === 'es' ? 'Resumen Ejecutivo (TL;DR)' : 'Executive Summary (TL;DR)'}
        </span>
        <p className="text-white/90 text-sm md:text-base leading-relaxed font-medium italic">
          {summary}
        </p>
      </div>
      
      {/* Visual indicator for AI Crawlers */}
      <div className="absolute -top-3 -right-3 p-2 bg-primary rounded-full shadow-lg" title="AI-Optimized Content">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
          <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
        </svg>
      </div>
    </motion.div>
  )
}
