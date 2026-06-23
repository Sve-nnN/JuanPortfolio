/**
 * @file Locale-scoped layout. Lives inside the `[locale]` segment so it can
 * derive the locale from `params` (no `headers()`), which keeps the route tree
 * static/ISR-friendly. Holds everything that depends on the locale: the
 * Organization/WebSite JSON-LD, LocaleProvider, Header and Footer.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import React from 'react'

import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { LocaleProvider } from '@/providers/Locale'
import { HtmlLangSync } from '@/components/HtmlLangSync'
import { JsonLd } from '@/components/JsonLd'
import { generateOrganizationSchema, generateWebSiteSchema } from '@/utilities/schema'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getServerSideURL } from '@/utilities/getURL'
import type { Locale } from '@/i18n/translations'
import type { SiteSetting } from '@/payload-types'

/**
 * The locale-scoped layout wrapping every page under `/[locale]`.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale?: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = (rawLocale === 'en' ? 'en' : 'es') as Locale

  const siteSettings = (await getCachedGlobal(
    'site-settings',
    3600,
    locale,
  )().catch(() => null)) as SiteSetting | null

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
    <LocaleProvider initialLocale={locale}>
      <HtmlLangSync locale={locale} />
      {organizationSchema && <JsonLd schema={organizationSchema} />}
      {websiteSchema && <JsonLd schema={websiteSchema} />}
      <Header locale={locale} />
      {children}
      <Footer locale={locale} />
    </LocaleProvider>
  )
}
