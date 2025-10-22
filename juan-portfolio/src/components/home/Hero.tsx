import React from 'react'
import type { Page } from '@/payload-types'
import Image from 'next/image'
import RichText from '@/components/RichText'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { ArrowRight } from 'lucide-react'
import { getServerSideURL } from '@/utilities/getURL'

const Hero = ({ hero }: { hero?: Page['hero'] }) => {
  if (!hero) return null

  // hero.media can be either an id (string) or populated upload object
  const mediaUrl =
    hero.media && typeof hero.media === 'object' && 'url' in hero.media && hero.media.url
      ? // populated upload object
        hero.media.url
      : null

  return (
    <header className="bg-background-light dark:bg-card-dark">
      <div className="max-w-6xl mx-auto px-6 py-20 grid gap-8 lg:grid-cols-2 items-center">
        <div>
          {/* Badge */}
          <div className="mb-4">
            <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
              Disponible para trabajar
            </span>
          </div>

          {/* Heading (using richText if available) */}
          {hero.richText ? (
            <div className="prose prose-lg max-w-none font-khand">
              <RichText data={hero.richText as DefaultTypedEditorState} />
            </div>
          ) : (
            <>
              <h1 className="text-4xl md:text-6xl font-display font-bold text-current mb-4 leading-tight">
                Juan Carlos Angulo
              </h1>
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-6">
                <span className="gradient-text">Desarrollador Web &amp; Especialista SEO</span>
              </h2>
            </>
          )}

          <p className="max-w-xl text-lg text-muted mb-8">
            Transformo ideas en sitios web rápidos, responsivos y optimizados para motores de
            búsqueda que impulsan el crecimiento de tu negocio.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            {hero.links && hero.links[0] ? (
              <a
                href={hero.links[0].link?.url || '#'}
                className="bg-primary text-white font-medium py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors inline-block"
              >
                {hero.links[0].link?.label || 'Contáctame'}
              </a>
            ) : (
              <a
                href="#contact"
                className="bg-primary text-white font-medium py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors inline-block"
              >
                Contáctame
              </a>
            )}

            <a
              href={hero.links && hero.links[1] ? hero.links[1].link?.url || '#work' : '#work'}
              className="bg-gray-200 dark:bg-gray-700 text-current font-medium py-3 px-8 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors inline-flex items-center"
            >
              <span>
                {hero.links && hero.links[1]
                  ? hero.links[1].link?.label || 'Mi Trabajo'
                  : 'Mi Trabajo'}
              </span>
              <ArrowRight className="ml-2" size={18} />
            </a>
          </div>
        </div>

        <div className="relative flex justify-center items-center">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-full blur-3xl opacity-30 dark:opacity-20" />
          {mediaUrl ? (
            <div className="relative rounded-full p-2 bg-transparent shadow-2xl">
              <div className="rounded-full bg-white border-8 border-white dark:border-card-dark overflow-hidden w-72 h-72 md:w-96 md:h-96">
                {mediaUrl ? (
                  <Image
                    src={getServerSideURL().replace(/\/$/, '') + mediaUrl}
                    alt={hero.media && typeof hero.media === 'object' ? hero.media.alt || '' : ''}
                    fill
                    className="object-cover rounded-full"
                  />
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export default Hero
