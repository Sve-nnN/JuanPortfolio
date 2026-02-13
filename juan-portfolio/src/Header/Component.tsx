import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'
import { headers } from 'next/headers'

import type { Header } from '@/payload-types'

export async function Header({ locale: _localeFromProps }: { locale?: 'en' | 'es' }) {
  const hdrs = await headers()
  const pathname = hdrs.get('x-pathname') || '/'
  const locale = (pathname.startsWith('/en') ? 'en' : 'es') as 'en' | 'es'

  // Use depth 2 so nested link.reference gets populated (slug, etc.)
  const headerData = (await getCachedGlobal('header', 2, locale)()) as Header

  return <HeaderClient data={headerData} locale={locale} />
}
