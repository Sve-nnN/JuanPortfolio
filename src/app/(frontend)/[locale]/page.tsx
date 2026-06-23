/**
 * @file Re-exports the PageTemplate and generateMetadata from the [slug]/page file.
 * Serves the home (slug defaults to 'home') for each locale.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import PageTemplate, { generateMetadata } from './[slug]/page'

// Enumerate the locales so the [locale] index (the home) is prerendered as
// static HTML with ISR instead of being rendered dynamically on demand.
// Issue #20.
export async function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }]
}

export const revalidate = 3600
export const dynamicParams = true

/**
 * Re-exports the default export from './[slug]/page'.
 * @see {@link PageTemplate}
 */
export default PageTemplate

/**
 * Re-exports the generateMetadata export from './[slug]/page'.
 * @see {@link generateMetadata}
 */
export { generateMetadata }
