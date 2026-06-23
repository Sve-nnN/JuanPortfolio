import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'

import type { Header } from '@/payload-types'

export async function Header({ locale = 'es' }: { locale?: 'en' | 'es' }) {
  // Locale comes from the [locale] route segment (passed by [locale]/layout.tsx),
  // not from headers() — keeps the route prerenderable/ISR. See issue #20.
  // Use depth 2 so nested link.reference gets populated (slug, etc.)
  const headerData = (await getCachedGlobal('header', 2, locale)()) as Header

  return <HeaderClient data={headerData} locale={locale} />
}
