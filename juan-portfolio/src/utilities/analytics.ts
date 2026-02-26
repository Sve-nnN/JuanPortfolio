import { sendGTMEvent } from '@next/third-parties/google'

/**
 * Sends a custom event to Google Tag Manager and GA4.
 * 
 * @param eventName - The name of the event (e.g., 'click_cta', 'form_submit')
 * @param eventParams - Optional object with additional data
 * 
 * @example
 * trackEvent('contact_form_success', { category: 'engagement' })
 */
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (typeof window === 'undefined') return

  sendGTMEvent({
    event: eventName,
    ...eventParams,
  })

  // Also send directly to GA4 if available (standard 'gtag' event)
  if (typeof (window as any).gtag === 'function') {
    ;(window as any).gtag('event', eventName, eventParams)
  }
}
