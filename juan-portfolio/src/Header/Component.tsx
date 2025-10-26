import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'

import type { Header } from '@/payload-types'

export async function Header() {
  // Use depth 2 so nested link.reference gets populated (slug, etc.)
  const headerData: Header = await getCachedGlobal('header', 2)()

  return <HeaderClient data={headerData} />
}
