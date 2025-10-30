/**
 * @file Defines the home page component.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import React from 'react'
import type { Home } from '@/payload-types'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import Link from 'next/link'

/**
 * The home page component.
 * It renders the blocks defined in the 'home' global from the CMS.
 * If no blocks are configured, it displays a setup guide.
 * @param {object} props - The component props.
 * @param {Home} props.homeGlobal - The 'home' global data.
 * @returns {Promise<React.ReactElement>} A promise that resolves to the home page component.
 */
const HomePage = async ({ homeGlobal }: { homeGlobal: Home }) => {
  const hasLayout = homeGlobal.layout && homeGlobal.layout.length > 0

  if (!hasLayout) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-current mb-6">
            Configura tu página Home
          </h1>
          <div className="bg-card rounded-lg shadow-lg p-8 text-left">
            <p className="text-muted mb-6">
              El global Home no tiene bloques configurados todavía. Ve a:
            </p>
            <ol className="list-decimal list-inside space-y-3 text-muted">
              <li>
                <Link href="/admin/globals/home" className="text-primary hover:underline">
                  /admin/globals/home
                </Link>
              </li>
              <li>Haz clic en &quot;Page Layout&quot;</li>
              <li>Agrega bloques como HeroHome, AboutSection, FeaturedBlogPosts, etc.</li>
              <li>Configura cada bloque con tu contenido</li>
              <li>Guarda</li>
            </ol>
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                💡 <strong>Tip:</strong> Puedes arrastrar los bloques para reordenarlos y crear tu
                página home personalizada.
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
      <RenderBlocks blocks={homeGlobal.layout as any} />
    </div>
  )
}

export default HomePage