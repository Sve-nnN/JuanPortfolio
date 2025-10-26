'use client'

import React, { createContext, useCallback, use, useEffect, useState } from 'react'

import type { Locale } from '@/i18n/translations'

const STORAGE_KEY = 'jc_locale'

type Context = {
  locale: Locale
  setLocale: (l: Locale) => void
}

const initialContext: Context = {
  // default will be overridden by provider
  locale: 'es',
  setLocale: () => null,
}

const LocaleContext = createContext<Context>(initialContext)

export const LocaleProvider = ({
  children,
  initialLocale,
}: {
  children: React.ReactNode
  initialLocale?: Locale
}) => {
  const [locale, setLocaleState] = useState<Locale>(initialLocale || 'es')

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null
      if (stored && (stored === 'en' || stored === 'es')) {
        setLocaleState(stored)
        return
      }
    } catch {
      // ignore localStorage errors
    }

    if (initialLocale) setLocaleState(initialLocale)
  }, [initialLocale])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      window.localStorage.setItem(STORAGE_KEY, l)
    } catch {
      // ignore
    }
  }, [])

  return <LocaleContext value={{ locale, setLocale }}>{children}</LocaleContext>
}

export const useLocale = () => use(LocaleContext)
