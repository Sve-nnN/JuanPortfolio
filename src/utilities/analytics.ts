import { sendGTMEvent } from '@next/third-parties/google'

/**
 * Canonical GA4 event names used across the site. Kept as a union for
 * consistency, but `trackEvent` also accepts any string so one-off events
 * don't require a code change. Several map to GA4 recommended events
 * (generate_lead, search, select_content).
 */
export type AnalyticsEvent =
  | 'cta_click'
  | 'navigation_click'
  | 'social_engagement'
  | 'content_navigation'
  | 'outbound_click'
  | 'generate_lead'
  | 'schedule_meeting'
  | 'language_switch'
  | 'scroll_depth'
  | 'content_engagement'
  | 'select_content'
  | 'search'
  | 'code_copied'
  | 'toc_navigation'

export type AnalyticsParams = Record<string, string | number | boolean | null | undefined>

// Keys we never want to forward to analytics (defensive PII guard).
const PII_KEYS = /(email|e-mail|phone|tel|name|password|token|secret|address)/i

function sanitize(params?: AnalyticsParams): AnalyticsParams {
  if (!params) return {}
  const out: AnalyticsParams = {}
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    if (PII_KEYS.test(k)) continue
    // Truncate long strings (GA4 param value cap is 100 chars).
    out[k] = typeof v === 'string' && v.length > 100 ? v.slice(0, 100) : v
  }
  return out
}

/**
 * Push a structured custom event to the GTM dataLayer. A single GA4-Event tag
 * in GTM (event name = {{Event}}, custom-event trigger) forwards everything to
 * GA4 — so we push to the dataLayer only (no direct gtag) to avoid double
 * counting. See docs/analytics-gtm-setup.md.
 *
 * @example trackEvent('cta_click', { label: 'Contact', location: 'hero' })
 */
export const trackEvent = (event: AnalyticsEvent | (string & {}), params?: AnalyticsParams) => {
  if (typeof window === 'undefined') return
  sendGTMEvent({ event, ...sanitize(params) })
}

/**
 * Build the `data-*` attributes that the global AnalyticsProvider's click
 * delegation reads. Lets any element (including server components) be tracked
 * by spreading props — no need to make the component a client component.
 *
 * @example <button {...gaAttrs('cta_click', { label: 'Book', location: 'footer' })}>
 */
export const gaAttrs = (
  event: AnalyticsEvent | (string & {}),
  params?: AnalyticsParams,
): Record<string, string> => {
  const attrs: Record<string, string> = { 'data-analytics': event }
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue
      attrs[`data-ga-${k.toLowerCase()}`] = String(v)
    }
  }
  return attrs
}
