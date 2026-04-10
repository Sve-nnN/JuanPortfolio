'use client'

import React from 'react'
import Turnstile from 'react-turnstile'

export const TurnstileWidget: React.FC<{ sitekey?: string }> = ({ sitekey }) => {
  const finalSiteKey = sitekey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  if (!finalSiteKey) {
    console.warn('Turnstile site key missing.')
    return null
  }

  return (
    <div className="flex justify-center md:justify-start">
      <Turnstile sitekey={finalSiteKey} theme="auto" />
    </div>
  )
}
