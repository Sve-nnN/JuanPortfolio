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
const ITEM_DELAYS = ['0ms', '100ms', '200ms', '300ms']

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
      className="min-h-[calc(100vh-80px)] flex items-center pt-32 pb-20 relative overflow-hidden"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Text content — scroll parallax (y2 + opacity) via .hero-text */}
          <div className="hero-text text-center lg:text-left flex flex-col items-center lg:items-start lg:order-1">
            {badge && (
              <span
                className="hero-item inline-flex items-center bg-primary/10 backdrop-blur-md border border-primary/20 text-primary text-xs font-bold tracking-[0.2em] uppercase px-4 py-1.5 rounded-full mb-8 shadow-sm"
                style={{ animationDelay: nextDelay() }}
              >
                {badge}
              </span>
            )}

            <h1
              className="hero-item font-display-lcp font-extrabold text-foreground mb-10 leading-[1.05] tracking-tight text-6xl md:text-4xl lg:text-5xl"
              style={{ animationDelay: nextDelay() }}
            >
              {title || 'Juan Carlos Angulo'}
              {subtitle && (
                <>
                  <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50 block mt-6 font-bold text-3xl md:text-5xl lg:text-6xl">
                    {subtitle}
                  </span>
                </>
              )}
            </h1>

            {/* Description or RichText */}
            <div
              className="hero-item max-w-2xl text-xl md:text-3xl text-muted-foreground mb-14 text-center lg:text-left leading-relaxed font-medium"
              style={{ animationDelay: nextDelay() }}
            >
              {richText ? (
                <RichText
                  className="prose-2xl dark:prose-invert"
                  data={richText}
                  enableGutter={false}
                />
              ) : description ? (
                <p>{description}</p>
              ) : null}
            </div>

            <div
              className="hero-item flex flex-col sm:flex-row gap-8 w-full sm:w-auto"
              style={{ animationDelay: nextDelay() }}
            >
              {primaryCta && primaryCta.label && primaryCta.url && (
                <CMSLink
                  url={primaryCta.url}
                  label={primaryCta.label}
                  locale={locale}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 px-12 text-xl rounded-full transition-all shadow-2xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1.5 text-center active:scale-95"
                />
              )}
              {secondaryCta && secondaryCta.label && secondaryCta.url && (
                <CMSLink
                  url={secondaryCta.url}
                  label={secondaryCta.label}
                  locale={locale}
                  className="bg-background/50 backdrop-blur-xl text-foreground border-2 border-border/50 hover:border-primary/50 font-bold py-6 px-12 text-xl rounded-full hover:bg-secondary/50 transition-all flex items-center justify-center group active:scale-95 shadow-lg"
                >
                  <ArrowRight
                    className="ml-3 group-hover:translate-x-2 transition-transform duration-500"
                    size={24}
                  />
                </CMSLink>
              )}
            </div>
          </div>

          {/* Media/Image — scroll scale via .hero-media (outer), entrance
              scale/rotate-in via .hero-media-inner (inner), so they compose. */}
          <div className="hero-media relative flex justify-center items-center lg:order-2">
            <div className="hero-media-inner relative flex justify-center items-center w-full">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-primary/5 rounded-full blur-[100px] opacity-60 animate-pulse-slow"></div>
              {media && typeof media === 'object' && (
                <div className="relative w-72 h-72 md:w-96 md:h-96 lg:w-[35rem] lg:h-[35rem] rounded-[3rem] hover:rotate-0 transition-transform duration-700 ease-out overflow-hidden border-2 border-border/50 shadow-2xl bg-card">
                  <Media
                    resource={media}
                    fill
                    priority
                    /* Cap the Cloudinary width: the portrait renders at most
                       ~560px (lg) but was served at 756px. width/height drive
                       the Cloudinary w_/h_ transform. CWV milestone v1.1. */
                    width={640}
                    height={640}
                    size="(min-width: 1024px) 560px, (min-width: 768px) 384px, 288px"
                    className="w-full h-full object-cover aspect-square"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </HeroScroll>
  )
}
