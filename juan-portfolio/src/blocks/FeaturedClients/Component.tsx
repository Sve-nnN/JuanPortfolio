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
    <section className="py-24 md:py-32 overflow-hidden bg-background relative">
      <div className="container mx-auto px-4 mb-16 md:mb-24 text-center">
        <div className="max-w-4xl mx-auto">
          {title && (
            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tighter mb-8 text-foreground">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-xl md:text-3xl text-muted-foreground leading-relaxed font-medium">
              {description}
            </p>
          )}
        </div>
      </div>
      
      <div className="relative group">
        {/* Gradients overlays for fade effect at edges */}
        <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-48 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div className="flex overflow-hidden py-12">
          {autoScroll ? (
            <motion.div 
              className="flex gap-12 md:gap-24 items-center"
              animate={{
                x: [0, -100 * clientDocs.length],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 40,
                  ease: "linear",
                },
              }}
              whileHover={{ transition: { duration: 80 } }} 
            >
              {duplicatedClients.map((c, i) => {
                const logo = c.logo as MediaType
                return (
                  <div 
                    key={i} 
                    className="relative w-40 md:w-64 h-24 md:h-32 flex-shrink-0 flex items-center justify-center p-8 rounded-[2rem] bg-card border border-border/50 hover:border-primary/30 transition-all group/logo shadow-sm hover:shadow-xl hover:-translate-y-1 duration-500"
                  >
                    {logo && logo.url && (
                      <Image 
                        src={logo.url} 
                        alt={c.name || 'Client'} 
                        fill 
                        className="object-contain p-6 opacity-40 group-hover/logo:opacity-100 transition-opacity grayscale group-hover/logo:grayscale-0 duration-700" 
                      />
                    )}
                  </div>
                )
              })}
            </motion.div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 container mx-auto">
              {clientDocs.map((c, i) => {
                const logo = c.logo as MediaType
                return (
                  <div 
                    key={i} 
                    className="relative w-40 md:w-64 h-24 md:h-32 flex items-center justify-center p-8 rounded-[2rem] bg-card border border-border/50 hover:border-primary/30 transition-all group/logo shadow-sm hover:shadow-xl hover:-translate-y-1 duration-500"
                  >
                    {logo && logo.url && (
                      <Image 
                        src={logo.url} 
                        alt={c.name || 'Client'} 
                        fill 
                        className="object-contain p-6 opacity-40 group-hover/logo:opacity-100 transition-opacity grayscale group-hover/logo:grayscale-0 duration-700" 
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
            className="inline-flex items-center gap-3 text-xl font-bold border-b-4 border-primary/20 pb-2 text-foreground hover:text-primary hover:border-primary transition-all group"
          >
            <span className="group-hover:translate-x-2 transition-transform inline-block">→</span>
          </CMSLink>
        </div>
      )}
    </section>
  )
}

export default FeaturedClients
