'use client'

import { useEffect } from 'react'

import type { Locale } from '@/i18n/translations'

/**
 * Keeps `<html lang>` in sync with the active locale on the client.
 *
 * The root layout renders `<html lang="es">` as a fixed default so it can stay
 * static (no `headers()` call to derive the locale on the server). For English
 * routes under `/en`, this tiny client component corrects the attribute after
 * hydration. hreflang/canonical are emitted server-side per page and remain
 * correct regardless; this only fixes the cosmetic `lang` attribute.
 */
export function HtmlLangSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    if (typeof document !== 'undefined' && document.documentElement.lang !== locale) {
      document.documentElement.lang = locale
    }
  }, [locale])

  return null
}
