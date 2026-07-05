'use client'

import React from 'react'
import type { FeaturedClientsBlock, Media as MediaType, Cliente } from '@/payload-types'
import Image from 'next/image'
import { CMSLink } from '@/components/Link'
import { motion } from 'framer-motion'
import { getOptimizedCloudinaryUrl } from '@/utilities/cloudinaryUrl'

function buildLogoSrc(url: string | null | undefined): string {
  if (!url) return ''
  // Logos render at ~104x70 CSS px; 192x96 covers retina (DPR ~2) without
  // shipping the oversized 256x128 variant. CWV milestone v1.1.
  return getOptimizedCloudinaryUrl(url, { width: 192, height: 96, format: 'auto', quality: 'auto' })
}

export const FeaturedClients: React.FC<FeaturedClientsBlock & { locale?: 'en' | 'es' }> = (
  props,
) => {
  const { title, description, clients, ctaLabel, ctaUrl, autoScroll = true, locale = 'es' } = props

  if (!clients || clients.length === 0) return null

  // Ensure we have a flat array of objects
  const clientDocs = clients.filter((c): c is Cliente => typeof c === 'object')

  if (clientDocs.length === 0) return null

  // Multiple sets for seamless infinite loop regardless of screen width
  const duplicatedClients = [...clientDocs, ...clientDocs, ...clientDocs, ...clientDocs]

  const clientsSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title || 'Clients',
    itemListElement: clientDocs.map((c, i) => {
      const logo = c.logo as MediaType
      const rawLogoUrl = logo?.cloudinaryUrl || logo?.url
      const logoUrl = rawLogoUrl ? buildLogoSrc(rawLogoUrl) : undefined
      const item: Record<string, unknown> = {
        '@type': 'Organization',
        name: c.name,
      }
      if (c.url) item.url = c.url
      if (logoUrl) item.logo = logoUrl
      return { '@type': 'ListItem', position: i + 1, item }
    }),
  }

  return (
    <section className="py-16 md:py-20 overflow-hidden bg-background relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(clientsSchema) }}
      />
      <div className="container mx-auto px-4 mb-10 md:mb-14 text-center">
        <div className="max-w-4xl mx-auto">
          {title && (
            <h2 className="text-section font-display font-bold tracking-tighter mb-8 text-foreground">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">
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
              className="flex gap-12 md:gap-12 items-center"
              animate={{
                x: [0, -100 * clientDocs.length],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: 40,
                  ease: 'linear',
                },
              }}
              whileHover={{ transition: { duration: 80 } }}
            >
              {duplicatedClients.map((c, i) => {
                const logo = c.logo as MediaType
                const rawSrc = logo?.cloudinaryUrl || logo?.url || ''
                const src = rawSrc ? buildLogoSrc(rawSrc) : ''
                const isCloudinary = src.includes('cloudinary.com')
                return (
                  <div
                    key={i}
                    className="relative w-40 md:w-64 h-24 md:h-32 flex-shrink-0 flex items-center justify-center p-8 rounded-2xl bg-white border border-border/50 hover:border-primary/30 transition-all group/logo shadow-sm hover:shadow-xl hover:-translate-y-1 duration-500"
                  >
                    {src && (
                      <Image
                        src={src}
                        alt={c.name || 'Client'}
                        fill
                        sizes="(max-width: 768px) 160px, 256px"
                        unoptimized={isCloudinary || src.startsWith('/')}
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
                const rawSrc = logo?.cloudinaryUrl || logo?.url || ''
                const src = rawSrc ? buildLogoSrc(rawSrc) : ''
                const isCloudinary = src.includes('cloudinary.com')
                return (
                  <div
                    key={i}
                    className="relative w-40 md:w-64 h-24 md:h-32 flex items-center justify-center p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all group/logo shadow-sm hover:shadow-xl hover:-translate-y-1 duration-500"
                  >
                    {src && (
                      <Image
                        src={src}
                        alt={c.name || 'Client'}
                        fill
                        sizes="(max-width: 768px) 160px, 256px"
                        unoptimized={isCloudinary || src.startsWith('/')}
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

      {ctaLabel && ctaUrl && (
        <div className="container mx-auto px-4 mt-16 md:mt-14 text-center">
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
