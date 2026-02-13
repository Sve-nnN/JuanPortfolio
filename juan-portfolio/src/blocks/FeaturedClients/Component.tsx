'use client'

import React from 'react'
import type { FeaturedClientsBlock, Media as MediaType, Cliente } from '@/payload-types'
import Image from 'next/image'
import { CMSLink } from '@/components/Link'
import { motion } from 'framer-motion'

export const FeaturedClients: React.FC<FeaturedClientsBlock & { locale?: 'en' | 'es' }> = (props) => {
  const { title, description, clients, ctaLabel, ctaUrl, autoScroll = true, locale = 'es' } = props
  
  if (!clients || clients.length === 0) return null

  // Ensure we have a flat array of objects
  const clientDocs = clients.filter((c): c is Cliente => typeof c === 'object')
  
  if (clientDocs.length === 0) return null

  // Multiple sets for seamless infinite loop regardless of screen width
  const duplicatedClients = [...clientDocs, ...clientDocs, ...clientDocs, ...clientDocs]

  return (
    <section className="py-24 md:py-32 overflow-hidden bg-white relative">
      <div className="container mx-auto px-4 mb-16 md:mb-24">
        <div className="max-w-3xl mx-auto text-center">
          {title && (
            <h2 className="text-4xl md:text-6xl font-array font-bold tracking-tighter mb-6 text-slate-900">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-xl md:text-2xl text-slate-600 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      
      <div className="relative group">
        {/* Gradients overlays for fade effect at edges */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="flex overflow-hidden">
          {autoScroll ? (
            <motion.div 
              className="flex gap-12 md:gap-20 items-center py-8"
              animate={{
                x: [0, -100 * clientDocs.length],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 30,
                  ease: "linear",
                },
              }}
              whileHover={{ transition: { duration: 60 } }} // Slow down on hover for accessibility
            >
              {duplicatedClients.map((c, i) => {
                const logo = c.logo as MediaType
                return (
                  <div 
                    key={i} 
                    className="relative w-32 md:w-48 h-16 md:h-24 flex-shrink-0 flex items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-primary/30 transition-colors group/logo shadow-sm"
                  >
                    {logo && logo.url && (
                      <Image 
                        src={logo.url} 
                        alt={c.name || 'Client'} 
                        fill 
                        className="object-contain p-4 opacity-60 group-hover/logo:opacity-100 transition-opacity grayscale group-hover/logo:grayscale-0 duration-500" 
                      />
                    )}
                  </div>
                )
              })}
            </motion.div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20 container mx-auto py-8">
              {clientDocs.map((c, i) => {
                const logo = c.logo as MediaType
                return (
                  <div 
                    key={i} 
                    className="relative w-32 md:w-48 h-16 md:h-24 flex-shrink-0 flex items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-primary/30 transition-colors group/logo shadow-sm"
                  >
                    {logo && logo.url && (
                      <Image 
                        src={logo.url} 
                        alt={c.name || 'Client'} 
                        fill 
                        className="object-contain p-4 opacity-60 group-hover/logo:opacity-100 transition-opacity grayscale group-hover/logo:grayscale-0 duration-500" 
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {(ctaLabel && ctaUrl) && (
        <div className="container mx-auto px-4 mt-16 md:mt-24 text-center">
          <CMSLink
            url={ctaUrl}
            label={ctaLabel}
            locale={locale}
            className="inline-flex items-center gap-2 text-lg font-bold border-b-2 border-primary pb-1 text-slate-900 hover:text-primary transition-all group"
          >
            <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
          </CMSLink>
        </div>
      )}
    </section>
  )
}

export default FeaturedClients
