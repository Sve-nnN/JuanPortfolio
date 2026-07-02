'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

import { trackEvent, type AnalyticsParams } from '@/utilities/analytics'

/**
 * Reads `data-ga-*` attributes off an element into an analytics params object.
 * `data-ga-label="Book a call"` → `{ label: 'Book a call' }`. Numeric/boolean
 * strings are coerced so GA4 gets typed values.
 */
function readParams(el: HTMLElement): AnalyticsParams {
  const params: AnalyticsParams = {}
  for (const attr of Array.from(el.attributes)) {
    if (!attr.name.startsWith('data-ga-')) continue
    const key = attr.name.slice('data-ga-'.length)
    const raw = attr.value
    if (raw === 'true' || raw === 'false') params[key] = raw === 'true'
    else if (raw !== '' && !Number.isNaN(Number(raw))) params[key] = Number(raw)
    else params[key] = raw
  }
  return params
}

/**
 * Site-wide analytics via event delegation. A single capture-phase click
 * listener walks up from the click target to the nearest `[data-analytics]`
 * element and pushes its event to the dataLayer. This lets ANY element —
 * including server-rendered ones — be tracked just by adding
 * `data-analytics="event_name"` (+ optional `data-ga-*` params), with no
 * per-component client code. See gaAttrs() in utilities/analytics.ts.
 *
 * Generic outbound-link and download tracking is intentionally left to GA4
 * Enhanced Measurement to avoid double counting (see docs/analytics-gtm-setup.md).
 */
export function AnalyticsProvider() {
  const pathname = usePathname()

  // Click delegation (CORE-02).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      const el = target?.closest<HTMLElement>('[data-analytics]')
      if (!el) return
      const event = el.dataset.analytics
      if (!event) return
      trackEvent(event, readParams(el))
    }

    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [])

  // Core Web Vitals field measurement (issue #103). INP is a field-only metric
  // (Lighthouse/PSI can't produce it) and CrUX has too little traffic to publish
  // it, so we collect it from real users here and forward it to GA4 via the
  // existing dataLayer — with attribution (which element/interaction caused it)
  // so it also feeds the LCP/INP performance work. web-vitals is lazy-imported so
  // it stays out of the critical bundle.
  useEffect(() => {
    let cancelled = false
    import('@/vendor/web-vitals-attribution')
      .then(({ onINP, onLCP, onCLS, onTTFB, onFCP }) => {
        if (cancelled) return
        const report = (metric: import('@/vendor/web-vitals-attribution').WebVitalMetric) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const a: Record<string, any> = metric.attribution || {}
          const target =
            a.interactionTarget || a.element || a.largestShiftTarget || a.eventTarget || undefined
          trackEvent('web_vitals', {
            metric: metric.name,
            // INP/LCP/FCP/TTFB in ms (integer); CLS is unitless → ×1000 to keep it an integer.
            value: metric.name === 'CLS' ? Math.round(metric.value * 1000) : Math.round(metric.value),
            rating: metric.rating,
            target: typeof target === 'string' ? target : undefined,
            interaction: a.interactionType || undefined,
            nav_type: metric.navigationType,
          })
        }
        onINP(report)
        onLCP(report)
        onCLS(report)
        onTTFB(report)
        onFCP(report)
      })
      .catch(() => {
        /* web-vitals failed to load — non-critical */
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Scroll depth milestones (ENG-01). GA4 Enhanced Measurement only fires at
  // 90%; we add 25/50/75/100, once each per page (reset on navigation).
  useEffect(() => {
    const fired = new Set<number>()
    const milestones = [25, 50, 75, 100]

    const onScroll = () => {
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      if (scrollable <= 0) return
      const percent = Math.round((window.scrollY / scrollable) * 100)
      for (const m of milestones) {
        if (percent >= m && !fired.has(m)) {
          fired.add(m)
          trackEvent('scroll_depth', { percent: m, path: pathname })
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  // Active-time engagement milestones (ENG-02). Timers pause when the tab is
  // hidden so we measure real attention, not idle background time.
  useEffect(() => {
    const milestones = [30, 60, 120, 300] // seconds
    let elapsed = 0
    let intervalId: ReturnType<typeof setInterval> | null = null

    const tick = () => {
      elapsed += 1
      const reached = milestones.find((m) => m === elapsed)
      if (reached) trackEvent('content_engagement', { milestone: reached, path: pathname })
    }

    const start = () => {
      if (intervalId == null && document.visibilityState === 'visible') {
        intervalId = setInterval(tick, 1000)
      }
    }
    const stop = () => {
      if (intervalId != null) {
        clearInterval(intervalId)
        intervalId = null
      }
    }
    const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop())

    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [pathname])

  return null
}
