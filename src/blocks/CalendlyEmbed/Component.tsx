'use client'

import React, { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import type { CalendlyEmbedBlock as CalendlyEmbedBlockProps } from '@/payload-types'
import { trackEvent } from '@/utilities/analytics'

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

  // Defer the heavy Calendly bundle (widget.js pulls ~2.6MB of booking JS/CSS
  // plus Stripe) until the section nears the viewport. Until then we render
  // only a lightweight placeholder, keeping it out of the initial load and off
  // the LCP/TBT critical path. SEO/CWV milestone v1.1.
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    if (inView) return
    const node = containerRef.current
    if (!node) return

    // No IntersectionObserver (very old browsers / SSR safety): load eagerly.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      // Start loading a bit before it scrolls into view for a seamless reveal.
      { rootMargin: '300px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [inView])

  // Track Calendly conversions: the widget posts a message when a meeting is
  // scheduled. GA4 recommended-ish conversion event. CONV-02 (v1.2).
  useEffect(() => {
    if (!inView) return
    const onMessage = (e: MessageEvent) => {
      if (
        typeof e.data === 'object' &&
        e.data?.event === 'calendly.event_scheduled' &&
        typeof e.origin === 'string' &&
        e.origin.includes('calendly.com')
      ) {
        trackEvent('schedule_meeting', { source: 'calendly' })
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [inView])

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
            <h2 className="text-section font-display font-bold tracking-tight mb-6 text-foreground">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">{subtitle}</p>
          )}
        </div>
      )}

      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden border border-border/50 shadow-xl"
        style={{ minHeight: widgetHeight }}
      >
        {(!inView || !scriptLoaded) && (
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

        {inView && (
          <>
            <div
              className="calendly-inline-widget"
              data-url={finalUrl}
              style={{ minWidth: '320px', height: widgetHeight }}
            />
            <Script
              src="https://assets.calendly.com/assets/external/widget.js"
              strategy="afterInteractive"
              onLoad={() => setScriptLoaded(true)}
            />
          </>
        )}
      </div>
    </section>
  )
}
