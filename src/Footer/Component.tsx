import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'

import type { Footer as FooterType, Post, CaseStudy } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { gaAttrs } from '@/utilities/analytics'
import { Github, Linkedin, Twitter, Instagram, Facebook, Youtube, ArrowUpRight } from 'lucide-react'

import { getPostUrl } from '@/utilities/getPostUrl'
import { Media as MediaComponent } from '@/components/Media'

export async function Footer({ locale }: { locale?: 'en' | 'es' }) {
  const footer = (await getCachedGlobal('footer', 1, locale)()) as FooterType
  const payload = await getPayload({ config })

  const {
    brand,
    mainNav,
    latestPosts: latestPostsConfig,
    caseStudies: caseStudiesConfig,
    bottomNav,
    socialLinks,
    copyright,
  } = footer || {}

  const localePrefix = locale === 'es' ? '' : '/en'

  // Fetch latest blog posts if enabled
  let latestPostsDocs: Post[] = []
  if (latestPostsConfig?.show) {
    const latestPosts = await payload.find({
      collection: 'posts',
      limit: latestPostsConfig.limit || 4,
      depth: 1,
      locale,
      where: {
        _status: {
          equals: 'published',
        },
      },
      sort: '-publishedAt',
    })
    latestPostsDocs = latestPosts.docs
  }

  // Fetch latest case studies if enabled
  let latestCaseStudiesDocs: CaseStudy[] = []
  if (caseStudiesConfig?.show) {
    const latestCaseStudies = await payload.find({
      collection: 'case-studies',
      limit: caseStudiesConfig.limit || 4,
      depth: 0,
      locale,
      where: {
        _status: {
          equals: 'published',
        },
      },
      sort: '-publishedAt',
    })
    latestCaseStudiesDocs = latestCaseStudies.docs
  }

  const socialIcons = {
    github: Github,
    linkedin: Linkedin,
    twitter: Twitter,
    instagram: Instagram,
    facebook: Facebook,
    youtube: Youtube,
  }

  return (
    <footer className="bg-card text-foreground border-t border-border/50 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 translate-x-1/2 translate-y-1/2" />
      
      <div className="container py-20 md:py-32">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-12">
          {/* Brand Column - Takes 4 cols on large screens */}
          <div className="lg:col-span-4 space-y-10">
            <Link
              href={localePrefix || '/'}
              className="inline-block text-4xl font-bold font-display text-foreground hover:text-primary transition-all tracking-tighter"
              aria-label={locale === 'es' ? 'Ir al inicio' : 'Go to home'}
            >
              {brand?.logoImage && typeof brand.logoImage !== 'string' ? (
                <div className="relative w-40 h-16">
                  <MediaComponent
                    resource={brand.logoImage}
                    fill
                    className="object-contain object-left"
                  />
                </div>
              ) : (
                <span className="font-display">{brand?.logoText || 'JCA'}</span>
              )}
            </Link>
            <p className="text-lg leading-relaxed text-muted-foreground max-w-sm font-medium">
              {brand?.description ||
                (locale === 'es'
                  ? 'Desarrollador Web & Especialista SEO. Creando experiencias digitales rápidas, accesibles y de alto impacto.'
                  : 'Web Developer & SEO Specialist. Creating fast, accessible, and high-impact digital experiences.')}
            </p>
            {socialLinks && socialLinks.length > 0 && (
              <div className="flex gap-4">
                {socialLinks.map((item, i) => {
                  const Icon = item.platform
                    ? socialIcons[item.platform as keyof typeof socialIcons]
                    : null
                  return (
                    <a
                      key={i}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-12 h-12 rounded-2xl bg-secondary/50 text-muted-foreground hover:text-primary hover:bg-secondary transition-all hover:scale-110 transform duration-300 border border-border/50 hover:border-primary/30 shadow-sm"
                      aria-label={`${locale === 'es' ? 'Visitar' : 'Visit'} ${item.platform || 'red social'}`}
                    >
                      {Icon && <Icon size={22} />}
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {/* Main Navigation - Takes 2 cols */}
          <div className="lg:col-span-2 space-y-8">
            <span className="text-xs font-bold text-foreground tracking-[0.2em] uppercase flex items-center gap-3">
              {mainNav?.title || (locale === 'es' ? 'Navegación' : 'Navigation')}
              <span className="inline-block w-8 h-1 bg-primary/20 rounded-full"></span>
            </span>
            {mainNav?.navItems && mainNav.navItems.length > 0 ? (
              <ul className="space-y-4">
                {mainNav.navItems.map(({ link }, i) => (
                  <li key={i}>
                    <CMSLink
                      {...link}
                      className="text-lg font-bold text-muted-foreground hover:text-primary transition-all inline-flex items-center gap-2 group hover:translate-x-2"
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-4">
                <li className="text-muted-foreground italic text-lg font-medium opacity-50">
                  {locale === 'es' ? 'Sin navegación' : 'No navigation'}
                </li>
              </ul>
            )}
          </div>

          {/* Latest Blog Posts - Takes 3 cols */}
          {latestPostsConfig?.show && (
            <div className="lg:col-span-3 space-y-8">
              <span className="text-xs font-bold text-foreground tracking-[0.2em] uppercase flex items-center gap-3">
                {latestPostsConfig.title || (locale === 'es' ? 'Últimos Posts' : 'Latest Posts')}
                <span className="inline-block w-8 h-1 bg-primary/20 rounded-full"></span>
              </span>
              {latestPostsDocs.length > 0 ? (
                <ul className="space-y-6">
                  {latestPostsDocs.map((post) => (
                    <li key={post.id}>
                      <Link
                        href={`${localePrefix}${getPostUrl(post)}`}
                        className="group flex items-start gap-3 text-base text-muted-foreground hover:text-primary transition-all leading-tight font-medium"
                        {...gaAttrs('navigation_click', { location: 'footer', label: 'latest_post' })}
                      >
                        <ArrowUpRight aria-hidden="true" className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary/40 group-hover:text-primary transition-colors" />
                        <span className="line-clamp-2">
                          {post.title || (locale === 'es' ? 'Ver artículo' : 'Read article')}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-lg text-muted-foreground opacity-50 font-medium">
                  {locale === 'es' ? 'No hay posts disponibles' : 'No posts available'}
                </p>
              )}
            </div>
          )}

          {/* Latest Case Studies - Takes 3 cols */}
          {caseStudiesConfig?.show && (
            <div className="lg:col-span-3 space-y-8">
              <h3 className="text-xs font-bold text-foreground tracking-[0.2em] uppercase flex items-center gap-3">
                {caseStudiesConfig.title || (locale === 'es' ? 'Casos' : 'Cases')}
                <span className="inline-block w-8 h-1 bg-primary/20 rounded-full"></span>
              </h3>
              {latestCaseStudiesDocs.length > 0 ? (
                <ul className="space-y-6">
                  {latestCaseStudiesDocs.map((caseStudy) => (
                    <li key={caseStudy.id}>
                      <Link
                        href={`${localePrefix}/case-studies/${caseStudy.slug}`}
                        className="group flex items-start gap-3 text-base text-muted-foreground hover:text-primary transition-all leading-tight font-medium"
                        {...gaAttrs('navigation_click', { location: 'footer', label: 'case_study' })}
                      >
                        <ArrowUpRight aria-hidden="true" className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary/40 group-hover:text-primary transition-colors" />
                        <span className="line-clamp-2">
                          {caseStudy.title || (locale === 'es' ? 'Ver caso de estudio' : 'View case study')}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-lg text-muted-foreground opacity-50 font-medium">
                  {locale === 'es' ? 'No hay casos disponibles' : 'No cases available'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 pt-10 border-t border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-base font-medium text-muted-foreground">
            <p>
              {copyright ||
                (locale === 'es'
                  ? `© ${new Date().getFullYear()} Juan Carlos Angulo. Todos los derechos reservados.`
                  : `© ${new Date().getFullYear()} Juan Carlos Angulo. All rights reserved.`)}
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-12">
              {bottomNav && bottomNav.length > 0 ? (
                bottomNav.map(({ link }, i) => (
                  <CMSLink
                    key={i}
                    {...link}
                    className="hover:text-primary transition-colors border-b border-transparent hover:border-primary/20"
                  />
                ))
              ) : (
                <>
                  <Link
                    href={`${localePrefix}/privacy`}
                    className="hover:text-primary transition-colors border-b border-transparent hover:border-primary/20"
                  >
                    {locale === 'es' ? 'Privacidad' : 'Privacy'}
                  </Link>
                  <Link
                    href={`${localePrefix}/terms`}
                    className="hover:text-primary transition-colors border-b border-transparent hover:border-primary/20"
                  >
                    {locale === 'es' ? 'Términos' : 'Terms'}
                  </Link>
                  <Link
                    href="/sitemap"
                    className="hover:text-primary transition-colors border-b border-transparent hover:border-primary/20"
                  >
                    Sitemap
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
