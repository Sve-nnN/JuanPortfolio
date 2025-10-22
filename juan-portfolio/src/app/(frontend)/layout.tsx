import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import localFont from 'next/font/local'
import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { ThemeProvider } from '@/providers/Theme/ThemeProvider.client'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

const ArrayFont = localFont({
  src: [
    { path: '../../fonts/array/Array-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/array/Array-Semibold.woff2', weight: '600', style: 'normal' },
    { path: '../../fonts/array/Array-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-array',
  display: 'swap',
})

const Khand = localFont({
  src: [
    { path: '../../fonts/khand/Khand-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/khand/Khand-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../fonts/khand/Khand-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-khand',
  display: 'swap',
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()

  return (
    <html className={cn(Khand.variable, ArrayFont.variable)} lang="en" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <Providers>
          <ThemeProvider>
            <AdminBar
              adminBarProps={{
                preview: isEnabled,
              }}
            />

            <Header />
            {children}
            <Footer />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@payloadcms',
  },
}
