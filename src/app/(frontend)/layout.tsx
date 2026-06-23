/**
 * @file Defines the root layout for the frontend application.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import localFont from 'next/font/local'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import React from 'react'

import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { ThemeProvider } from '@/providers/Theme/ThemeProvider.client'
import { LocaleProvider } from '@/providers/Locale'
import { ScrollProvider } from '@/providers/ScrollProvider'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode, headers } from 'next/headers'
import type { Locale } from '@/i18n/translations'

import { Analytics } from '@vercel/analytics/next'
import { GoogleTagManager } from '@next/third-parties/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Script from 'next/script'
import { JsonLd } from '@/components/JsonLd'
import { generateOrganizationSchema, generateWebSiteSchema } from '@/utilities/schema'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { SiteSetting } from '@/payload-types'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

import dynamic from 'next/dynamic'

const AdminBar = dynamic(() => import('@/components/AdminBar').then((m) => m.AdminBar), {
  ssr: true,
})

/**
 * Local font configuration for the 'Array' font family.
 */
const ArrayFont = localFont({
  src: [
    { path: './../../fonts/array/Array-Regular.woff2', weight: '400', style: 'normal' },
    { path: './../../fonts/array/Array-Semibold.woff2', weight: '600', style: 'normal' },
    { path: './../../fonts/array/Array-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-array',
  display: 'swap',
})

/**
 * Local font configuration for the 'Khand' font family.
 */
const Khand = localFont({
  src: [
    { path: './../../fonts/khand/Khand-Regular.woff2', weight: '400', style: 'normal' },
    { path: './../../fonts/khand/Khand-Medium.woff2', weight: '500', style: 'normal' },
    { path: './../../fonts/khand/Khand-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-khand',
  display: 'swap',
  // Secondary heading family, not in the LCP/above-the-fold path. Skip preload
  // so its 3 woff2 stop competing for bandwidth with the LCP image preload.
  // SEO audit jun-2026, issue #39.
  preload: false,
})

/**
 * The root layout component for the frontend.
 */
export default async function RootLayout({
  children,
  params: _paramsPromise,
}: {
  children: React.ReactNode
  params: Promise<{ locale?: string }>
}) {
  const { isEnabled } = await draftMode()
  const hdrs = await headers()
  const pathname = hdrs.get('x-pathname') || '/'
  const locale = (pathname.startsWith('/en') ? 'en' : 'es') as Locale

  const siteSettings = (await getCachedGlobal('site-settings', 3600, locale)().catch(() => null)) as SiteSetting | null

  const baseUrl = getServerSideURL()

  const organizationSchema = siteSettings
    ? generateOrganizationSchema({
        name: siteSettings.organizationName || 'Juan Tech',
        url: siteSettings.siteUrl || baseUrl,
        logo:
          typeof siteSettings.logo === 'object' && siteSettings.logo
            ? (siteSettings.logo as { url?: string }).url
            : undefined,
        description: siteSettings.organizationDescription || undefined,
        sameAs: Array.isArray(siteSettings.socialProfiles)
          ? siteSettings.socialProfiles
              .map((profile: { url?: string }) => profile?.url)
              .filter((url): url is string => typeof url === 'string')
          : undefined,
        contactPoint: siteSettings.contactType
          ? {
              contactType: siteSettings.contactType,
              email: siteSettings.contactEmail || undefined,
              telephone: siteSettings.contactPhone || undefined,
            }
          : undefined,
      })
    : null

  const websiteSchema = siteSettings
    ? generateWebSiteSchema(
        siteSettings.organizationName || 'Juan Tech',
        siteSettings.siteUrl || baseUrl,
        siteSettings.searchUrl || '/search',
      )
    : null

  return (
    <html
      className={cn(
        Khand.variable,
        ArrayFont.variable,
        GeistSans.variable,
        GeistMono.variable,
        'dark',
      )}
      lang={locale}
      suppressHydrationWarning
    >
      <head>
        {/* LCP hero images are served from Cloudinary; open the connection
            early so the high-priority image preload doesn't pay the TLS/DNS
            cost on the critical path. SEO audit jun-2026, issue #36. */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body className="dark">
        <InitTheme />
        {organizationSchema && <JsonLd schema={organizationSchema} />}
        {websiteSchema && <JsonLd schema={websiteSchema} />}
        <Providers>
          <ThemeProvider>
            <LocaleProvider initialLocale={locale}>
              <ScrollProvider>
                <AdminBar
                  adminBarProps={{
                    preview: isEnabled,
                  }}
                />

                <Header locale={locale} />
                {children}
                <Footer locale={locale} />
              </ScrollProvider>
            </LocaleProvider>
          </ThemeProvider>
        </Providers>
        <SpeedInsights />
        <Analytics />
        <React.Suspense fallback={null}>
          {/* GA4 fires through GTM (configure the GA4 tag in the GTM container),
              so the standalone GoogleAnalytics component would double-count and
              add a redundant tracking lib. SEO audit jun-2026, issue #58. */}
          {process.env.NEXT_PUBLIC_GTM_ID && (
            <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
          )}
        </React.Suspense>
        {/* Ahrefs Analytics - Loaded after page is interactive to protect performance */}
        <Script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="MKWDNj5f8/fviyOxhzLSPA"
          strategy="afterInteractive"
        />
        {/* Speculation Rules API — raw <script> (not next/script) so Chrome processes it
            via the HTML parser from SSR output, not via dynamic JS injection. */}
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prefetch: [
                {
                  source: 'document',
                  where: {
                    and: [
                      { href_matches: '/*' },
                      { not: { href_matches: '/admin/**' } },
                      { not: { href_matches: '/api/**' } },
                    ],
                  },
                  eagerness: 'moderate',
                },
              ],
            }),
          }}
        />
      </body>
    </html>
  )
}

/**
 * Generates metadata for the root layout.
 */
export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{ locale?: string }>
}): Promise<Metadata> {
  const { locale: rawLocale } = await paramsPromise
  const locale = (rawLocale && ['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as Locale

  const baseUrl = getServerSideURL().replace(/\/$/, '')

  return {
    metadataBase: new URL(baseUrl),
    openGraph: mergeOpenGraph({
      locale: locale === 'es' ? 'es_ES' : 'en_US',
    }),
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '32x32' },
        { url: '/favicon.svg', type: 'image/svg+xml' },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      creator: '@jcangulo',
    },
    alternates: {
      canonical: locale === 'es' ? `${baseUrl}/` : `${baseUrl}/en`,
      languages: {
        'es': `${baseUrl}/`,
        'en': `${baseUrl}/en`,
        'x-default': `${baseUrl}/`,
      },
    },
  }
}
