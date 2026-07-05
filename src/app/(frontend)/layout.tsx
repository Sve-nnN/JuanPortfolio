/**
 * @file Defines the root layout for the frontend application.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import localFont from 'next/font/local'
import { GeistMono } from 'geist/font/mono'
import React from 'react'

import { Providers } from '@/providers'
import { AnalyticsProvider } from '@/providers/Analytics'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { ThemeProvider } from '@/providers/Theme/ThemeProvider.client'
import { ScrollProvider } from '@/providers/ScrollProvider'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import type { Locale } from '@/i18n/translations'

import { Analytics } from '@vercel/analytics/next'
import { GoogleTagManager } from '@next/third-parties/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Script from 'next/script'

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
  // Full Array family (Regular/Semibold/Bold) for headings, footer logo and
  // prose. NOT preloaded: only the H1's Bold weight is above-the-fold (see
  // ArrayBold below). These swap in below the fold. CWV v1.7 (PERF-08).
  preload: false,
})

/**
 * Array Bold only — the home H1 (LCP element) renders in this weight, so it's
 * the single font we preload above the fold. Exposed as `--font-array-bold`
 * and applied via the `.font-display-lcp` utility on the LCP heading. Keeping
 * it a separate instance lets us preload just Bold without preloading the
 * Regular/Semibold weights of the full family above. CWV v1.7 (PERF-08).
 */
const ArrayBold = localFont({
  src: [{ path: './../../fonts/array/Array-Bold.woff2', weight: '700', style: 'normal' }],
  variable: '--font-array-bold',
  display: 'swap',
  preload: true,
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
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The root layout is intentionally free of dynamic APIs (no draftMode()/
  // headers()) so the whole tree can be prerendered/ISR. `<html lang>` is fixed
  // to the default locale; the locale-dependent chrome (Header, Footer,
  // Organization/WebSite schema, LocaleProvider) lives in [locale]/layout.tsx,
  // which derives the locale from params. See issue #20.
  return (
    <html
      className={cn(
        Khand.variable,
        ArrayFont.variable,
        ArrayBold.variable,
        GeistMono.variable,
        'dark',
      )}
      lang="es"
      suppressHydrationWarning
    >
      <head>
        {/* `<html lang>` is rendered as the default `es` so the tree stays
            static (no headers() to derive locale on the server). This inline
            script corrects it from the URL before first paint — earlier than
            the React HtmlLangSync effect — so JS-rendering crawlers see the
            right lang on `/en` routes and it matches the per-page hreflang.
            HREF-01. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var l=location.pathname.split('/')[1]==='en'?'en':'es';if(document.documentElement.lang!==l)document.documentElement.lang=l;}catch(e){}})();",
          }}
        />
        {/* LCP hero images are served from Cloudinary; open the connection
            early so the high-priority image preload doesn't pay the TLS/DNS
            cost on the critical path. SEO audit jun-2026, issue #36. */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body className="dark">
        <InitTheme />
        <Providers>
          <ThemeProvider>
            <ScrollProvider>
              {/* AdminBar self-detects the logged-in editor on the client, so it
                  needs no server-side draftMode() preview prop. */}
              <AdminBar adminBarProps={{}} />

              {/* Site-wide GA4 click delegation: tracks any element carrying
                  data-analytics attributes (see providers/Analytics). v1.2. */}
              <AnalyticsProvider />

              {children}
            </ScrollProvider>
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
        {/* Ahrefs Analytics — lazyOnload so it loads during browser idle, after
            the LCP/interaction window, keeping it off the TBT critical path.
            CWV milestone v1.1. */}
        <Script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="MKWDNj5f8/fviyOxhzLSPA"
          strategy="lazyOnload"
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
