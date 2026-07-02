// Minimal type surface for the vendored web-vitals@4 attribution build.
// Only the reporters used by the analytics provider are declared. Issue #103.

export interface WebVitalMetric {
  name: 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB' | 'FID'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  navigationType?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attribution?: Record<string, any>
}

export type WebVitalReportCallback = (metric: WebVitalMetric) => void

export function onINP(cb: WebVitalReportCallback, opts?: unknown): void
export function onLCP(cb: WebVitalReportCallback, opts?: unknown): void
export function onCLS(cb: WebVitalReportCallback, opts?: unknown): void
export function onTTFB(cb: WebVitalReportCallback, opts?: unknown): void
export function onFCP(cb: WebVitalReportCallback, opts?: unknown): void
