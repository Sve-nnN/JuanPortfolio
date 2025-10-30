/**
 * @file Defines the root layout for the frontend application.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
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
import { LocaleProvider } from '@/providers/Locale'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode, headers } from 'next/headers'
import type { Locale } from '@/i18n/translations'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * Local font configuration for the 'Array' font family.
 * @type {object}
 */
const ArrayFont = localFont({
  src: [
    { path: '../../fonts/array/Array-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/array/Array-Semibold.woff2', weight: '600', style: 'normal' },
    { path: '../../fonts/array/Array-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-array',
  display: 'swap',
})

/**
 * Local font configuration for the 'Khand' font family.
 * @type {object}
 */
const Khand = localFont({
  src: [
    { path: '../../fonts/khand/Khand-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/khand/Khand-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../fonts/khand/Khand-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-khand',
  display: 'swap',
})

/**
 * The root layout component for the frontend.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The children to render.
 * @returns {Promise<React.ReactElement>} The root layout component.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()

  // Detect locale from Accept-Language header
  const hdrs = await headers()
  const acceptLanguage = hdrs.get('accept-language') || undefined
  const rawLocale = acceptLanguage ? acceptLanguage.split(',')[0].split('-')[0] : undefined
  const initialLocale: Locale = (
    rawLocale && ['en', 'es'].includes(rawLocale) ? rawLocale : 'es'
  ) as Locale

  return (
    <html
      className={cn(Khand.variable, ArrayFont.variable, 'dark')}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body className="dark">
        <Providers>
          <ThemeProvider>
            <LocaleProvider initialLocale={initialLocale}>
              <AdminBar
                adminBarProps={{
                  preview: isEnabled,
                }}
              />

              <Header />
              {children}
              <Footer />
            </LocaleProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}

/**
 * The metadata for the root layout.
 * @type {Metadata}
 */
export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@payloadcms',
  },
}