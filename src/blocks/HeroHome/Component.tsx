import React from 'react'
import { ArrowRight } from 'lucide-react'
import RichText from '@/components/RichText'
import { Media } from '@/components/Media'
import type { HeroHomeBlock as HeroHomeBlockType } from '@/payload-types'
import { CMSLink } from '@/components/Link'
import { HeroScroll } from './HeroScroll.client'

/**
 * Home hero.
 *
 * Server component (Phase 39, CWV v1.7). The H1 is the LCP element and now
 * renders as plain SSR HTML — it no longer depends on hydration. The entrance
 * animation is pure CSS (`.hero-item` / `.hero-media-inner`, see globals.css)
 * and the scroll parallax is driven by the tiny `HeroScroll` client wrapper,
 * which sets `--sy` (scrollY) for the CSS transforms. framer-motion is no longer
 * imported here, so it stays out of the above-the-fold bundle.
 *
 * `staggerChildren: 0.1` is reproduced with per-item `animationDelay`.
 */
const ITEM_DELAYS = ['0ms', '80ms', '160ms', '240ms', '320ms']

export const HeroHome: React.FC<HeroHomeBlockType & { locale?: 'en' | 'es' }> = (props) => {
  const {
    badge,
    title,
    subtitle,
    description,
    richText,
    primaryCta,
    secondaryCta,
    media,
    locale = 'es',
  } = props

  // Track which staggered item we're on so delays match the old framer order
  // (badge → h1 → description → CTAs).
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

      {/* Centered single-column hero. Scroll parallax (y + opacity) via .hero-text. */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="hero-text max-w-3xl mx-auto flex flex-col items-center text-center">
          {/* Avatar — small, circular, LCP-priority. Glow behind for the motion feel. */}
          {media && typeof media === 'object' && (
            <div
              className="hero-item relative mb-8"
              style={{ animationDelay: nextDelay() }}
            >
              <div className="absolute -inset-6 bg-gradient-to-tr from-primary/30 to-primary/5 rounded-full blur-2xl opacity-70 animate-pulse-slow" />
              <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-border/60 shadow-xl bg-card ring-4 ring-primary/10">
                <Media
                  resource={media}
                  fill
                  priority
                  width={256}
                  height={256}
                  size="128px"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

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
            className="hero-item max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-9 leading-relaxed font-medium"
            style={{ animationDelay: nextDelay() }}
          >
            {richText ? (
              <RichText className="prose-lg dark:prose-invert" data={richText} enableGutter={false} />
            ) : description ? (
              <p>{description}</p>
            ) : null}
          </div>

          <div
            className="hero-item flex flex-col sm:flex-row items-center justify-center gap-4"
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
      </div>
    </HeroScroll>
  )
}
