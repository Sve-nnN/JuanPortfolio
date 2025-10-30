/**
 * @file Re-exports the PageTemplate and generateMetadata from the [slug]/page file.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import PageTemplate, { generateMetadata } from './[slug]/page'

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