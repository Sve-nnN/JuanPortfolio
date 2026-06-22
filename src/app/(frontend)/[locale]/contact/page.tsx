import type { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { ContactFormBlockComponent } from '@/blocks/ContactFormBlock/Component'
import type { ContactFormBlock } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { JsonLd } from '@/components/JsonLd'
import { generateWebPageSchema, generateBreadcrumbSchema } from '@/utilities/schema'

export async function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }]
}

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: rawLocale } = await paramsPromise
  const locale = rawLocale === 'en' ? 'en' : 'es'
  const base = getServerSideURL()
  const canonical = locale === 'en' ? `${base}/en/contact` : `${base}/contact`

  return {
    title: locale === 'en' ? 'Contact — Juan Carlos Angulo' : 'Contacto — Juan Carlos Angulo',
    description:
      locale === 'en'
        ? 'Start a project or just say hello. I respond within 24 hours.'
        : 'Inicia un proyecto o simplemente saluda. Respondo en menos de 24 horas.',
    alternates: {
      canonical,
      languages: {
        es: `${base}/contact`,
        en: `${base}/en/contact`,
        'x-default': `${base}/contact`,
      },
    },
  }
}

export default async function ContactPage({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await paramsPromise
  const locale = (rawLocale === 'en' ? 'en' : 'es') as 'en' | 'es'

  // Try to load contact form config from CMS if a contactForm block was saved
  const payload = await getPayload({ config: configPromise })
  const pageRes = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'contact' } },
    limit: 1,
    depth: 2,
    locale,
  })
  const cmPage = pageRes.docs[0]
  const contactBlock = cmPage?.content?.layout?.find(
    (b): b is ContactFormBlock => (b as { blockType: string }).blockType === 'contactForm',
  )

  // Default block props when no CMS page exists
  const defaultProps: ContactFormBlock = {
    blockType: 'contactForm',
    eyebrow: locale === 'en' ? "Let's talk" : 'Hablemos',
    title:
      locale === 'en'
        ? "Start a project or just say hello"
        : 'Inicia un proyecto o simplemente saluda',
    description:
      locale === 'en'
        ? 'I respond within 24 hours. All conversations are confidential.'
        : 'Respondo en menos de 24 horas. Toda conversación es confidencial.',
    submitLabel: locale === 'en' ? 'Send message' : 'Enviar mensaje',
    sidebarTitle: locale === 'en' ? 'Contact info' : 'Información de contacto',
    sidebarDescription:
      locale === 'en'
        ? 'Available for freelance projects, consulting, and full-time roles.'
        : 'Disponible para proyectos freelance, consultoría y posiciones de tiempo completo.',
  }

  const localePrefix = locale === 'en' ? '/en' : ''
  // SEO audit jun-2026, issue #48: ContactPage + breadcrumb structured data.
  const pageSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      generateWebPageSchema({
        type: 'ContactPage',
        name: locale === 'en' ? 'Contact' : 'Contacto',
        url: `${localePrefix}/contact`,
      }),
      generateBreadcrumbSchema([
        { name: locale === 'en' ? 'Home' : 'Inicio', url: localePrefix || '/' },
        { name: locale === 'en' ? 'Contact' : 'Contacto', url: `${localePrefix}/contact` },
      ]),
    ].filter(Boolean),
  }

  return (
    <main className="pt-16">
      <JsonLd schema={pageSchema} />
      <ContactFormBlockComponent {...(contactBlock ?? defaultProps)} locale={locale} />
    </main>
  )
}
