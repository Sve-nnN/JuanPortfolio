import { sendGTMEvent } from '@next/third-parties/google'

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void
  }
}

/**
 * Sends a custom event to Google Tag Manager and GA4.
 *
 * @param eventName - The name of the event (e.g., 'click_cta', 'form_submit')
 * @param eventParams - Optional object with additional data
 *
 * @example
 * trackEvent('contact_form_success', { category: 'engagement' })
 */
export const trackEvent = (eventName: string, eventParams?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return

  sendGTMEvent({
    event: eventName,
    ...eventParams,
  })

  // Also send directly to GA4 if available (standard 'gtag' event)
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams)
  }
}
