'use client'

import React, { useState } from 'react'
import Script from 'next/script'
import type { CalendlyEmbedBlock as CalendlyEmbedBlockProps } from '@/payload-types'

const HEIGHT_MAP = {
  compact: 500,
  default: 700,
  tall: 900,
} as const

function buildCalendlyUrl(
  baseUrl: string,
  options: {
    hideEventTypeDetails?: boolean | null
    hideGdprBanner?: boolean | null
    backgroundColor?: string | null
    primaryColor?: string | null
    textColor?: string | null
  },
): string {
  const url = new URL(baseUrl)
  if (options.hideEventTypeDetails) url.searchParams.set('hide_event_type_details', '1')
  if (options.hideGdprBanner) url.searchParams.set('hide_gdpr_banner', '1')
  if (options.backgroundColor) url.searchParams.set('background_color', options.backgroundColor)
  if (options.primaryColor) url.searchParams.set('primary_color', options.primaryColor)
  if (options.textColor) url.searchParams.set('text_color', options.textColor)
  return url.toString()
}

export const CalendlyEmbedBlock: React.FC<CalendlyEmbedBlockProps & { locale?: 'en' | 'es' }> = (
  props,
) => {
  const {
    calendlyUrl,
    title,
    subtitle,
    height = 'default',
    hideEventTypeDetails,
    hideGdprBanner,
    backgroundColor,
    primaryColor,
    textColor,
  } = props

  const [scriptLoaded, setScriptLoaded] = useState(false)

  if (!calendlyUrl) return null

  const widgetHeight = HEIGHT_MAP[(height as keyof typeof HEIGHT_MAP) ?? 'default'] ?? 700

  let finalUrl = calendlyUrl
  try {
    finalUrl = buildCalendlyUrl(calendlyUrl, {
      hideEventTypeDetails,
      hideGdprBanner,
      backgroundColor,
      primaryColor,
      textColor,
    })
  } catch {
    // Fallback to raw URL if parsing fails (e.g. relative URL in preview)
    finalUrl = calendlyUrl
  }

  return (
    <section className="container mx-auto px-4 md:px-8">
      {(title || subtitle) && (
        <div className="text-center mb-12 max-w-3xl mx-auto">
          {title && (
            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-6 text-foreground">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">{subtitle}</p>
          )}
        </div>
      )}

      <div className="relative rounded-[2rem] overflow-hidden border border-border/50 shadow-xl">
        {!scriptLoaded && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-card/90 backdrop-blur-sm z-10"
            style={{ height: widgetHeight }}
          >
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Cargando calendario…</span>
            </div>
          </div>
        )}

        <div
          className="calendly-inline-widget"
          data-url={finalUrl}
          style={{ minWidth: '320px', height: widgetHeight }}
        />
      </div>

      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
        onLoad={() => setScriptLoaded(true)}
      />
    </section>
  )
}
