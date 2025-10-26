import React from 'react'
import type { Page } from '@/payload-types'
import { ArrowRight } from 'lucide-react'
import { t, type Locale } from '@/i18n/translations'
// RichText is rendered client-side via HeroRichText to avoid hydration issues
import HeroRichText from './HeroRichText.client'
import HeroMedia from './HeroMedia.client'

const Hero = ({ hero, locale = 'es' }: { hero?: Page['hero']; locale?: Locale }) => {
  if (!hero) return null

  // hero.media can be either an id (string) or populated upload object
  let mediaUrl: string | null = null
  if (hero.media) {
    if (typeof hero.media === 'string') {
      // Assume it's an upload id; Payload exposes uploads at /api/uploads/:id
      mediaUrl = `/api/uploads/${hero.media}`
    } else if (typeof hero.media === 'object' && 'url' in hero.media && hero.media.url) {
      mediaUrl = hero.media.url
    }
  }

  return (
    <header className="bg-background-light dark:bg-card-dark">
      <div className="max-w-6xl mx-auto px-6 py-20 grid gap-8 lg:grid-cols-2 items-center">
        <div>
          {/* Badge */}
          <div className="mb-4">
            <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
              {hero?.richText ? '' : t(locale, 'home.hero.badge')}
            </span>
          </div>

          {/* Heading / rich text (editable in Payload) */}
          {hero.richText ? (
            (() => {
              // Server-safe extraction of first heading and paragraph to avoid hydration mismatches
              try {
                const root = (hero.richText as Record<string, unknown>)?.root as
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
                    <HeroRichText data={hero.richText} skipFirstNodes={skipCount} />
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
            {hero.links && hero.links[0] ? (
              <a
                href={hero.links[0].link?.url || '#'}
                className="bg-primary text-white font-medium py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors inline-block"
              >
                {hero.links[0].link?.label || t(locale, 'home.hero.contact')}
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
              href={hero.links && hero.links[1] ? hero.links[1].link?.url || '#work' : '#work'}
              className="bg-gray-200 dark:bg-gray-700 text-current font-medium py-3 px-8 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors inline-flex items-center"
            >
              <span>
                {hero.links && hero.links[1]
                  ? hero.links[1].link?.label || t(locale, 'home.hero.work')
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
          <HeroMedia media={hero.media} />
        </div>
      </div>
    </header>
  )
}

export default Hero
