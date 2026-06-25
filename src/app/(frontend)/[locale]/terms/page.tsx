import type { Metadata } from 'next'
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
  const canonical = locale === 'en' ? `${base}/en/terms` : `${base}/terms`

  const title = locale === 'en' ? 'Terms of Service — Juan Carlos Angulo' : 'Términos de Servicio — Juan Carlos Angulo'
  const description =
    locale === 'en'
      ? 'Terms and conditions for using this website and engaging my services.'
      : 'Términos y condiciones de uso de este sitio web y de contratación de mis servicios.'

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        es: `${base}/terms`,
        en: `${base}/en/terms`,
        'x-default': `${base}/terms`,
      },
    },
    // og:title/og:url missing on standalone pages → Ahrefs flags incomplete OG. META-04.
    openGraph: {
      title,
      description,
      url: canonical,
    },
  }
}

export default async function TermsPage({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await paramsPromise
  const locale = rawLocale === 'en' ? 'en' : 'es'
  const isEn = locale === 'en'
  const localePrefix = isEn ? '/en' : ''

  // SEO audit jun-2026, issue #48.
  const pageSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      generateWebPageSchema({
        name: isEn ? 'Terms of Service' : 'Términos de Servicio',
        url: `${localePrefix}/terms`,
      }),
      generateBreadcrumbSchema([
        { name: isEn ? 'Home' : 'Inicio', url: localePrefix || '/' },
        { name: isEn ? 'Terms of Service' : 'Términos de Servicio', url: `${localePrefix}/terms` },
      ]),
    ].filter(Boolean),
  }

  return (
    <main className="container mx-auto px-4 py-24 max-w-3xl">
      <JsonLd schema={pageSchema} />
      <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-8 text-foreground">
        {isEn ? 'Terms of Service' : 'Términos de Servicio'}
      </h1>
      <p className="text-muted-foreground mb-12">
        {isEn ? 'Last updated: ' : 'Última actualización: '}
        <time dateTime="2025-01-01">2025</time>
      </p>

      <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
        <section>
          <h2>{isEn ? '1. Acceptance of Terms' : '1. Aceptación de los Términos'}</h2>
          <p>
            {isEn
              ? 'By accessing and using this website (juan-tech.com), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use this site.'
              : 'Al acceder y utilizar este sitio web (juan-tech.com), aceptas y te comprometes a cumplir con estos Términos de Servicio. Si no estás de acuerdo, por favor no uses este sitio.'}
          </p>
        </section>

        <section>
          <h2>{isEn ? '2. Services' : '2. Servicios'}</h2>
          <p>
            {isEn
              ? 'This website is a personal portfolio and blog by Juan Carlos Angulo, offering technical content, case studies, and professional consulting services in software engineering and technical SEO.'
              : 'Este sitio web es el portafolio y blog personal de Juan Carlos Angulo, que ofrece contenido técnico, casos de estudio y servicios de consultoría profesional en ingeniería de software y SEO técnico.'}
          </p>
        </section>

        <section>
          <h2>{isEn ? '3. Intellectual Property' : '3. Propiedad Intelectual'}</h2>
          <p>
            {isEn
              ? 'All content on this site — including articles, code samples, designs, and case studies — is the exclusive property of Juan Carlos Angulo unless otherwise noted. You may quote or reference content with proper attribution and a link back to the original.'
              : 'Todo el contenido de este sitio —incluyendo artículos, ejemplos de código, diseños y casos de estudio— es propiedad exclusiva de Juan Carlos Angulo salvo que se indique lo contrario. Puedes citar o referenciar el contenido con la atribución correcta y un enlace al original.'}
          </p>
        </section>

        <section>
          <h2>{isEn ? '4. Limitation of Liability' : '4. Limitación de Responsabilidad'}</h2>
          <p>
            {isEn
              ? 'The content on this site is provided for informational purposes only. Juan Carlos Angulo makes no warranties about the accuracy or completeness of the content and shall not be liable for any damages arising from the use of this site.'
              : 'El contenido de este sitio se proporciona únicamente con fines informativos. Juan Carlos Angulo no garantiza la exactitud o completitud del contenido y no será responsable de ningún daño derivado del uso de este sitio.'}
          </p>
        </section>

        <section>
          <h2>{isEn ? '5. Contact' : '5. Contacto'}</h2>
          <p>
            {isEn
              ? 'For questions about these terms, please reach out via the '
              : 'Para preguntas sobre estos términos, contáctame a través de la '}
            <a href={isEn ? '/en/contact' : '/contact'} className="text-primary hover:underline">
              {isEn ? 'contact page' : 'página de contacto'}
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  )
}
