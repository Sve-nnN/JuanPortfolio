import React from 'react'
import type { Page } from '@/payload-types'
import { ArrowRight } from 'lucide-react'
import { t, type Locale } from '@/i18n/translations'
// RichText is rendered client-side via HeroRichText to avoid hydration issues
import HeroRichText from './HeroRichText.client'
import HeroMedia from './HeroMedia.client'

const Hero = ({ hero, locale = 'es' }: { hero?: Page['hero']; locale?: Locale }) => {
  if (!hero) return null

  // Extract the actual hero data from hero.hero
  const heroData = hero.hero

  return (
    <header className="bg-background-light dark:bg-card-dark">
      <div className="max-w-6xl mx-auto px-6 py-20 grid gap-8 lg:grid-cols-2 items-center">
        <div>
          {/* Badge */}
          <div className="mb-4">
            <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
              {heroData?.richText ? '' : t(locale, 'home.hero.badge')}
            </span>
          </div>

          {/* Heading / rich text (editable in Payload) */}
          {heroData.richText ? (
            (() => {
              // Server-safe extraction of first heading and paragraph to avoid hydration mismatches
              try {
                const root = (heroData.richText as Record<string, unknown>)?.root as
                  | Record<string, unknown>
                  | undefined
                const children = Array.isArray(root?.children) ? (root?.children as unknown[]) : []
                let firstHeading = ''
                let headingIndex = -1
                for (let i = 0; i < children.length; i++) {
                  const c = children[i] as Record<string, unknown>
                  if (
                    headingIndex === -1 &&
                    typeof c?.tag === 'string' &&
                    /^h[1-6]$/.test(String(c.tag)) &&
                    Array.isArray(c.children)
                  ) {
                    const arr = c.children as unknown[]
                    firstHeading = arr
                      .map((x) => (x as Record<string, unknown>)?.['text'] || '')
                      .join('')
                    headingIndex = i
                  }
                  if (headingIndex !== -1) break
                }

                // Calculate how many top-level nodes we consumed so the client renderer can skip them
                // Only skip the heading node (if present). We intentionally do NOT render the
                // first paragraph server-side to avoid duplication and layout jitter.
                const skipCount = headingIndex === -1 ? 0 : headingIndex + 1

                return (
                  <div className="mb-6">
                    {firstHeading ? (
                      <h1 className="text-4xl md:text-6xl font-display font-bold text-current mb-4 leading-tight">
                        {firstHeading}
                      </h1>
                    ) : null}
                    {/* Full rich text renderer (client-only) — skip the heading node to avoid duplication */}
                    <HeroRichText data={heroData.richText} skipFirstNodes={skipCount} />
                  </div>
                )
              } catch {
                // fallback to i18n text if anything goes wrong
                return (
                  <>
                    <h1 className="text-4xl md:text-6xl font-display font-bold text-current mb-4 leading-tight">
                      {t(locale, 'home.hero.title')}
                    </h1>
                    <p className="max-w-xl text-lg text-muted mb-8">
                      {t(locale, 'home.hero.description')}
                    </p>
                  </>
                )
              }
            })()
          ) : (
            <>
              <h1 className="text-4xl md:text-6xl font-display font-bold text-current mb-4 leading-tight">
                {t(locale, 'home.hero.title')}
              </h1>
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-6">
                <span className="gradient-text">{t(locale, 'home.hero.subtitle')}</span>
              </h2>

              <p className="max-w-xl text-lg text-muted mb-8">
                {t(locale, 'home.hero.description')}
              </p>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            {heroData.links && heroData.links[0] ? (
              <a
                href={heroData.links[0].link?.url || '#'}
                className="bg-primary text-white font-medium py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors inline-block"
              >
                {heroData.links[0].link?.label || t(locale, 'home.hero.contact')}
              </a>
            ) : (
              <a
                href="#contact"
                className="bg-primary text-white font-medium py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors inline-block"
              >
                {t(locale, 'home.hero.contact')}
              </a>
            )}

            <a
              href={
                heroData.links && heroData.links[1]
                  ? heroData.links[1].link?.url || '#work'
                  : '#work'
              }
              className="bg-gray-200 dark:bg-gray-700 text-current font-medium py-3 px-8 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors inline-flex items-center"
            >
              <span>
                {heroData.links && heroData.links[1]
                  ? heroData.links[1].link?.label || t(locale, 'home.hero.work')
                  : t(locale, 'home.hero.work')}
              </span>
              <ArrowRight className="ml-2" size={18} />
            </a>
          </div>
        </div>

        <div className="relative flex justify-center items-center">
          {/* gradient ring behind the image, uses CSS vars for light/dark harmony */}
          <div className="absolute -inset-6 hero-gradient rounded-full blur-3xl opacity-70 dark:opacity-40" />
          {/* HeroMedia is client-only and resolves upload ids or populated objects */}
          <HeroMedia media={heroData.media} />
        </div>
      </div>
    </header>
  )
}

export default Hero
