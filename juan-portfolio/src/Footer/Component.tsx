import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'

import type { Footer as FooterType, Post, CaseStudy } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Github, Linkedin, Twitter, Instagram, Facebook, Youtube, ArrowUpRight } from 'lucide-react'

import { getPostUrl } from '@/utilities/getPostUrl'
import { Media as MediaComponent } from '@/components/Media'

export async function Footer() {
  const footer = await getCachedGlobal('footer', 1)() as FooterType
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

  // Fetch latest blog posts if enabled
  let latestPostsDocs: Post[] = []
  if (latestPostsConfig?.show) {
    const latestPosts = await payload.find({
      collection: 'posts',
      limit: latestPostsConfig.limit || 4,
      depth: 1,
      // Debugging: removed status filter to see if posts exist at all
      // where: {
      //   _status: {
      //     equals: 'published',
      //   },
      // },
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
      // Debugging: removed status filter
      // where: {
      //   _status: {
      //     equals: 'published',
      //   },
      // },
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
    <footer className="bg-slate-900 dark:bg-black text-slate-100 border-t border-slate-800 dark:border-slate-900">
      <div className="container py-16 md:py-20">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand Column - Takes 3 cols on large screens */}
          <div className="lg:col-span-3 space-y-6">
            <Link
              href="/"
              className="inline-block text-3xl font-bold font-array text-white hover:text-blue-400 transition-colors"
              aria-label="Ir al inicio"
            >
              {brand?.logoImage && typeof brand.logoImage !== 'string' ? (
                <div className="relative w-32 h-12">
                  <MediaComponent resource={brand.logoImage} fill className="object-contain object-left" />
                </div>
              ) : (
                <span className="font-array">{brand?.logoText || 'JCA'}</span>
              )}
            </Link>
            <p className="text-sm leading-relaxed text-slate-300 max-w-xs">
              {brand?.description ||
                'Desarrollador Web & Especialista SEO. Creando experiencias digitales rápidas, accesibles y de alto impacto.'}
            </p>
            {socialLinks && socialLinks.length > 0 && (
              <div className="flex gap-3">
                {socialLinks.map((item, i) => {
                  const Icon = item.platform ? socialIcons[item.platform as keyof typeof socialIcons] : null
                  return (
                    <a
                      key={i}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800 dark:bg-slate-900 text-slate-300 hover:text-blue-400 hover:bg-slate-700 dark:hover:bg-slate-800 transition-all hover:scale-110 transform duration-200 border border-slate-700 dark:border-slate-800"
                      aria-label={`Visitar ${item.platform || 'red social'}`}
                    >
                      {Icon && <Icon size={18} />}
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {/* Main Navigation - Takes 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase flex items-center gap-2">
              {mainNav?.title || 'Navegación'}
              <span className="inline-block w-8 h-px bg-blue-500"></span>
            </h3>
            {mainNav?.navItems && mainNav.navItems.length > 0 ? (
              <ul className="space-y-2.5">
                {mainNav.navItems.map(({ link }, i) => (
                  <li key={i}>
                    {/* Removed children to avoid double text rendering. CMSLink renders the label. */}
                    <CMSLink
                      {...link}
                      className="text-sm text-slate-300 hover:text-blue-400 transition-all inline-flex items-center gap-1 group hover:translate-x-1"
                    />
                  </li>
                ))}
              </ul>
            ) : (
              // Fallback if no navItems configured yet
              <ul className="space-y-2.5">
                <li className="text-slate-500 italic text-sm">No navigation configured</li>
              </ul>
            )}
          </div>

          {/* Latest Blog Posts - Takes 3 cols */}
          {latestPostsConfig?.show && (
            <div className="lg:col-span-3 space-y-4">
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase flex items-center gap-2">
                {latestPostsConfig.title || 'Últimos Posts'}
                <span className="inline-block w-8 h-px bg-blue-500"></span>
              </h3>
              {latestPostsDocs.length > 0 ? (
                <ul className="space-y-3">
                  {latestPostsDocs.map((post) => (
                    <li key={post.id}>
                      <Link
                        href={getPostUrl(post)}
                        className="group flex items-start gap-2 text-sm text-slate-300 hover:text-blue-400 transition-colors"
                      >
                        <ArrowUpRight className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="line-clamp-2 group-hover:underline underline-offset-2">
                          {post.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">No hay posts disponibles</p>
              )}
              {latestPostsConfig.viewAllLink && (
                <CMSLink
                  {...latestPostsConfig.viewAllLink}
                  label={latestPostsConfig.viewAllText || 'Ver todos los posts'}
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300 hover:gap-2 transition-all mt-2"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </CMSLink>
              )}
            </div>
          )}

          {/* Latest Case Studies - Takes 2 cols */}
          {caseStudiesConfig?.show && (
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase flex items-center gap-2">
                {caseStudiesConfig.title || 'Casos'}
                <span className="inline-block w-8 h-px bg-blue-500"></span>
              </h3>
              {latestCaseStudiesDocs.length > 0 ? (
                <ul className="space-y-3">
                  {latestCaseStudiesDocs.map((caseStudy) => (
                    <li key={caseStudy.id}>
                      <Link
                        href={`/case-studies/${caseStudy.slug}`}
                        className="group flex items-start gap-2 text-sm text-slate-300 hover:text-blue-400 transition-colors"
                      >
                        <ArrowUpRight className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="line-clamp-2 group-hover:underline underline-offset-2">
                          {caseStudy.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">No hay casos disponibles</p>
              )}
              {caseStudiesConfig.viewAllLink && (
                <CMSLink
                  {...caseStudiesConfig.viewAllLink}
                  label={caseStudiesConfig.viewAllText || 'Ver todos'}
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300 hover:gap-2 transition-all mt-2"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </CMSLink>
              )}
            </div>
          )}

          {/* Removed Legacy Dynamic Columns */}
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-slate-800 dark:border-slate-900">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm">
            <p className="text-slate-400">
              {copyright || '© 2024 Juan Carlos Angulo. Todos los derechos reservados.'}
            </p>
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
              {bottomNav && bottomNav.length > 0 ? (
                bottomNav.map(({ link }, i) => (
                  <CMSLink
                    key={i}
                    {...link}
                    className="text-slate-400 hover:text-slate-200 transition-colors hover:underline underline-offset-4"
                  />
                ))
              ) : (
                <>
                  <Link
                    href="/privacy"
                    className="text-slate-400 hover:text-slate-200 transition-colors hover:underline underline-offset-4"
                  >
                    Privacidad
                  </Link>
                  <Link
                    href="/terms"
                    className="text-slate-400 hover:text-slate-200 transition-colors hover:underline underline-offset-4"
                  >
                    Términos
                  </Link>
                  <Link
                    href="/sitemap"
                    className="text-slate-400 hover:text-slate-200 transition-colors hover:underline underline-offset-4"
                  >
                    Sitemap
                  </Link>
                  <Link
                    href="/sitemap.xml"
                    className="text-slate-400 hover:text-slate-200 transition-colors hover:underline underline-offset-4"
                  >
                    Sitemap XML
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
