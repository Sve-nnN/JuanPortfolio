import React from 'react'
import { ArrowRight } from 'lucide-react'
import RichText from '@/components/RichText'
import type { HeroHomeBlock as HeroHomeBlockType } from '@/payload-types'
import { CMSLink } from '@/components/Link'
import { HeroScroll } from './HeroScroll.client'

/**
 * Home hero — "terminal / code" layout (v1.8 redesign).
 *
 * Server component (perf carried over from Phase 39/CWV v1.7). The H1 is the LCP
 * element and renders as plain SSR HTML — no hydration dependency. Entrance is
 * pure CSS (`.hero-item` stagger) and scroll parallax is driven by the tiny
 * `HeroScroll` client wrapper (`--sy`). framer-motion is not imported here, so it
 * stays out of the above-the-fold bundle. The terminal window on the right is
 * fully static (CSS-only blinking cursor).
 */
const ITEM_DELAYS = ['0ms', '80ms', '160ms', '240ms']

// Decorative terminal score rows (10-block bars). Static, presentational.
const TERMINAL_SCORES: Array<{ label: string; score: number }> = [
  { label: 'Performance', score: 100 },
  { label: 'SEO', score: 100 },
  { label: 'Best Practices', score: 100 },
]

export const HeroHome: React.FC<HeroHomeBlockType & { locale?: 'en' | 'es' }> = (props) => {
  const { badge, title, subtitle, description, richText, primaryCta, secondaryCta, locale = 'es' } =
    props

  // Staggered entrance order: badge → h1 → description → CTAs.
  let itemIndex = 0
  const nextDelay = () => ITEM_DELAYS[Math.min(itemIndex++, ITEM_DELAYS.length - 1)]

  return (
    <HeroScroll
      className="flex items-center pt-24 pb-16 md:pt-28 md:pb-20 relative overflow-hidden"
      id="home"
    >
      {/* Background Ambience — scroll parallax (y1 + opacity) via .hero-backdrop */}
      <div className="hero-backdrop absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/15 rounded-full blur-[120px] animate-pulse-slow" />
        <div
          className="absolute top-[30%] -right-[10%] w-[50%] h-[70%] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-10 items-center">
          {/* Text column — scroll parallax (y2 + opacity) via .hero-text */}
          <div className="hero-text text-center lg:text-left flex flex-col items-center lg:items-start">
            {badge && (
              <span
                className="hero-item inline-flex items-center bg-primary/10 backdrop-blur-md border border-primary/20 text-primary text-xs font-bold tracking-[0.2em] uppercase px-4 py-1.5 rounded-full mb-6 shadow-sm"
                style={{ animationDelay: nextDelay() }}
              >
                {badge}
              </span>
            )}

            <h1
              className="hero-item text-display font-display-lcp font-extrabold text-foreground mb-6 leading-[1.05] tracking-tight"
              style={{ animationDelay: nextDelay() }}
            >
              {title || 'Juan Carlos Angulo'}
              {subtitle && (
                <>
                  <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50 block mt-3 font-bold text-xl sm:text-2xl lg:text-3xl">
                    {subtitle}
                  </span>
                </>
              )}
            </h1>

            {/* Description or RichText */}
            <div
              className="hero-item max-w-xl text-lg md:text-xl text-muted-foreground mb-9 leading-relaxed font-medium"
              style={{ animationDelay: nextDelay() }}
            >
              {richText ? (
                <RichText className="prose-lg dark:prose-invert" data={richText} enableGutter={false} />
              ) : description ? (
                <p>{description}</p>
              ) : null}
            </div>

            <div
              className="hero-item flex flex-col sm:flex-row items-center gap-4"
              style={{ animationDelay: nextDelay() }}
            >
              {primaryCta && primaryCta.label && primaryCta.url && (
                <CMSLink url={primaryCta.url} label={primaryCta.label} locale={locale} appearance="default" />
              )}
              {secondaryCta && secondaryCta.label && secondaryCta.url && (
                <CMSLink
                  url={secondaryCta.url}
                  label={secondaryCta.label}
                  locale={locale}
                  appearance="outline"
                  className="group"
                >
                  <ArrowRight
                    className="ml-1 group-hover:translate-x-1 transition-transform duration-300"
                    size={20}
                  />
                </CMSLink>
              )}
            </div>
          </div>

          {/* Terminal window — static, developer aesthetic. Rises in as one item. */}
          <div
            className="hero-item w-full max-w-lg mx-auto lg:mx-0 lg:justify-self-end"
            style={{ animationDelay: '160ms' }}
          >
            <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-md shadow-2xl overflow-hidden">
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-background/40">
                <span className="w-3 h-3 rounded-full bg-destructive/70" />
                <span className="w-3 h-3 rounded-full bg-warning/70" />
                <span className="w-3 h-3 rounded-full bg-success/70" />
                <span className="ml-3 font-mono text-xs text-muted-foreground">~ juan-tech.com</span>
              </div>
              {/* Body */}
              <div className="p-5 font-mono text-sm leading-relaxed text-foreground/90">
                <p className="text-muted-foreground">
                  <span className="text-primary">$</span> lighthouse ./ --mobile
                </p>
                <div className="mt-3 space-y-1.5">
                  {TERMINAL_SCORES.map(({ label, score }) => {
                    const filled = Math.round(score / 10)
                    return (
                      <div key={label} className="flex items-center gap-3">
                        <span className="w-28 text-muted-foreground">{label}</span>
                        <span className="tracking-tight text-primary">
                          {'█'.repeat(filled)}
                          <span className="text-border">{'░'.repeat(10 - filled)}</span>
                        </span>
                        <span className="text-success font-bold">{score}</span>
                      </div>
                    )
                  })}
                </div>
                <p className="mt-4 text-success">✓ deploy → vercel ● live</p>
                <p className="mt-1 text-muted-foreground">
                  <span className="text-primary">$</span>{' '}
                  <span className="inline-block w-2 h-4 align-middle bg-primary animate-pulse" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HeroScroll>
  )
}
