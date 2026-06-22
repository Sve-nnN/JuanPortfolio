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
  const canonical = locale === 'en' ? `${base}/en/privacy` : `${base}/privacy`

  return {
    title: locale === 'en' ? 'Privacy Policy — Juan Carlos Angulo' : 'Política de Privacidad — Juan Carlos Angulo',
    description:
      locale === 'en'
        ? 'How this website collects, uses, and protects your personal data.'
        : 'Cómo este sitio web recopila, usa y protege tus datos personales.',
    alternates: {
      canonical,
      languages: {
        es: `${base}/privacy`,
        en: `${base}/en/privacy`,
        'x-default': `${base}/privacy`,
      },
    },
  }
}

export default async function PrivacyPage({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await paramsPromise
  const locale = rawLocale === 'en' ? 'en' : 'es'
  const isEn = locale === 'en'
  const localePrefix = isEn ? '/en' : ''

  // SEO audit jun-2026, issue #48: give the standalone page a basic WebPage +
  // BreadcrumbList structured-data identity.
  const pageSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      generateWebPageSchema({
        name: isEn ? 'Privacy Policy' : 'Política de Privacidad',
        url: `${localePrefix}/privacy`,
      }),
      generateBreadcrumbSchema([
        { name: isEn ? 'Home' : 'Inicio', url: localePrefix || '/' },
        { name: isEn ? 'Privacy Policy' : 'Política de Privacidad', url: `${localePrefix}/privacy` },
      ]),
    ].filter(Boolean),
  }

  return (
    <main className="container mx-auto px-4 py-24 max-w-3xl">
      <JsonLd schema={pageSchema} />
      <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-8 text-foreground">
        {isEn ? 'Privacy Policy' : 'Política de Privacidad'}
      </h1>
      <p className="text-muted-foreground mb-12">
        {isEn ? 'Last updated: ' : 'Última actualización: '}
        <time dateTime="2025-01-01">2025</time>
      </p>

      <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
        <section>
          <h2>{isEn ? '1. Information We Collect' : '1. Información que Recopilamos'}</h2>
          <p>
            {isEn
              ? 'This site collects minimal data: contact form submissions (name, email, message) and anonymous analytics through Google Analytics and Cloudflare Insights. No cookies are set beyond technical session requirements.'
              : 'Este sitio recopila datos mínimos: envíos del formulario de contacto (nombre, email, mensaje) y analíticas anónimas a través de Google Analytics y Cloudflare Insights. No se utilizan cookies más allá de los requisitos técnicos de sesión.'}
          </p>
        </section>

        <section>
          <h2>{isEn ? '2. How We Use Your Data' : '2. Cómo Usamos tus Datos'}</h2>
          <p>
            {isEn
              ? 'Contact form data is used solely to respond to your inquiry. Analytics data is used in aggregate to improve the site experience. Your data is never sold to third parties.'
              : 'Los datos del formulario de contacto se usan únicamente para responder tu consulta. Los datos de analíticas se usan de forma agregada para mejorar la experiencia del sitio. Tus datos nunca se venden a terceros.'}
          </p>
        </section>

        <section>
          <h2>{isEn ? '3. Third-Party Services' : '3. Servicios de Terceros'}</h2>
          <p>
            {isEn
              ? 'This site uses Cloudinary for image storage, Vercel for hosting, Google Analytics for traffic analysis, and Cloudflare for security and performance. Each service has its own privacy policy.'
              : 'Este sitio usa Cloudinary para almacenamiento de imágenes, Vercel para hosting, Google Analytics para análisis de tráfico y Cloudflare para seguridad y rendimiento. Cada servicio tiene su propia política de privacidad.'}
          </p>
        </section>

        <section>
          <h2>{isEn ? '4. Data Retention' : '4. Retención de Datos'}</h2>
          <p>
            {isEn
              ? 'Contact form submissions are retained for up to 12 months to support follow-up communication. You may request deletion at any time.'
              : 'Los envíos del formulario de contacto se conservan hasta 12 meses para dar seguimiento a la comunicación. Puedes solicitar su eliminación en cualquier momento.'}
          </p>
        </section>

        <section>
          <h2>{isEn ? '5. Your Rights' : '5. Tus Derechos'}</h2>
          <p>
            {isEn
              ? 'You have the right to access, correct, or delete any personal data we hold about you. To exercise these rights, contact us via the '
              : 'Tienes derecho a acceder, corregir o eliminar cualquier dato personal que tengamos sobre ti. Para ejercer estos derechos, contáctanos a través de la '}
            <a href={isEn ? '/en/contact' : '/contact'} className="text-primary hover:underline">
              {isEn ? 'contact page' : 'página de contacto'}
            </a>
            .
          </p>
        </section>

        <section>
          <h2>{isEn ? '6. Cookies' : '6. Cookies'}</h2>
          <p>
            {isEn
              ? 'This site uses only technical cookies required for functionality (e.g. draft mode previews). No third-party advertising cookies are set.'
              : 'Este sitio utiliza únicamente cookies técnicas necesarias para el funcionamiento (p. ej. previsualización de borradores). No se utilizan cookies de publicidad de terceros.'}
          </p>
        </section>
      </div>
    </main>
  )
}
