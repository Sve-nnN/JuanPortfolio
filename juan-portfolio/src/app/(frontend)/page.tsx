/**
 * @file Root page component that serves the Spanish home page by default.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import PageTemplate, { generateMetadata as generatePageMetadata } from './[locale]/[slug]/page'

/**
 * The root page component.
 * It uses the PageTemplate from [locale]/[slug]/page with locale 'es' and slug 'home'.
 * @returns {Promise<React.ReactElement>} A promise that resolves to the home page in Spanish.
 */
export default async function RootPage() {
  return <PageTemplate params={Promise.resolve({ locale: 'es', slug: 'home' })} />
}

/**
 * Generates metadata for the root page.
 * @returns {Promise<import('next').Metadata>} A promise that resolves to the page metadata.
 */
export async function generateMetadata() {
  return generatePageMetadata({ params: Promise.resolve({ locale: 'es', slug: 'home' }) })
}
