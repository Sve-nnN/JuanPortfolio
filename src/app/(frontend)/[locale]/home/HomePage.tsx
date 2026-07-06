/**
 * @file Defines the home page component.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import React from 'react'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import Link from 'next/link'

/**
 * The home page component.
 * It renders the home `layout` blocks (from the Pages `home` entry or, as a
 * fallback, the `home` global). If no blocks are configured, it displays a setup guide.
 * @param {object} props - The component props.
 * @param {unknown} props.layout - The home layout blocks (Pages content.layout or global layout).
 * @returns {Promise<React.ReactElement>} A promise that resolves to the home page component.
 */
const HomePage = async ({ layout: layoutProp, locale = 'es' }: { layout: unknown; locale?: 'en' | 'es' }) => {
  let layout = layoutProp

  // Handle case where layout might be an object due to previous localization setting
  if (layout && !Array.isArray(layout) && typeof layout === 'object') {
    // @ts-expect-error - Handling legacy localized layout
    layout = layout[locale] || layout.es || []
  }

  const hasLayout = layout && Array.isArray(layout) && layout.length > 0

  if (!hasLayout) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-current mb-6">
            {locale === 'es' ? 'Configura tu página Home' : 'Set up your Home page'}
          </h1>
          <div className="bg-card rounded-lg shadow-lg p-8 text-left">
            <p className="text-muted mb-6">
              {locale === 'es' 
                ? 'El global Home no tiene bloques configurados todavía. Ve a:'
                : 'The Home global has no blocks configured yet. Go to:'}
            </p>
            <ol className="list-decimal list-inside space-y-3 text-muted">
              <li>
                <Link href="/admin/globals/home" className="text-primary hover:underline">
                  /admin/globals/home
                </Link>
              </li>
              <li>{locale === 'es' ? 'Haz clic en "Page Layout"' : 'Click on "Page Layout"'}</li>
              <li>{locale === 'es' ? 'Agrega bloques como HeroHome, AboutSection, FeaturedBlogPosts, etc.' : 'Add blocks like HeroHome, AboutSection, FeaturedBlogPosts, etc.'}</li>
              <li>{locale === 'es' ? 'Configura cada bloque con tu contenido' : 'Configure each block with your content'}</li>
              <li>{locale === 'es' ? 'Guarda' : 'Save'}</li>
            </ol>
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                💡 <strong>Tip:</strong> {locale === 'es' 
                  ? 'Puedes arrastrar los bloques para reordenarlos y crear tu página home personalizada.'
                  : 'You can drag blocks to reorder them and create your custom home page.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <RenderBlocks blocks={layout as any} locale={locale} />
    </div>
  )
}

export default HomePage