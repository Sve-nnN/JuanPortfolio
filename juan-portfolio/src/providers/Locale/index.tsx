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
  initialLocale = 'es',
}: {
  children: React.ReactNode
  initialLocale?: Locale
}) => {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  useEffect(() => {
    setLocaleState(initialLocale)
    try {
      window.localStorage.setItem(STORAGE_KEY, initialLocale)
    } catch {
      // ignore
    }
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

export const useLocale = () => {
  const context = use(LocaleContext)
  if (context === undefined) {
    return initialContext
  }
  return context
}
