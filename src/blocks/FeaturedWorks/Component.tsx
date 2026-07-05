import React from 'react'
import type { FeaturedWorksBlock, CaseStudy } from '@/payload-types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { Media } from '@/components/Media'
import { ArrowUpRight } from 'lucide-react'
import { CMSLink } from '@/components/Link'

import { domAnimation, LazyMotion, m } from 'framer-motion'

export const FeaturedWorks: React.FC<FeaturedWorksBlock & { locale?: 'en' | 'es' }> = async ({
  title,
  description,
  works,
  ctaLabel,
  ctaUrl,
  locale = 'es'
}) => {
  let displayWorks: CaseStudy[] = []

  if (works && works.length > 0) {
    displayWorks = works.filter((w): w is CaseStudy => typeof w === 'object')
  } else {
    try {
      const payload = await getPayload({ config: configPromise })
      const res = await payload.find({
        collection: 'case-studies',
        limit: 4,
        sort: '-publishedAt',
        locale,
      })
      displayWorks = (res.docs as CaseStudy[]) || []
    } catch {
      displayWorks = []
    }
  }

  const localePrefix = locale === 'es' ? '' : '/en'
  
  return (
    <LazyMotion features={domAnimation}>
      <section className="py-24 md:py-48 bg-background relative overflow-hidden" id="works">
        {/* Background Ambience */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 pointer-events-none opacity-30">
          <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 md:px-8">
          <m.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col md:flex-row justify-between items-end mb-24 gap-12"
          >
            <div className="max-w-4xl">
              <h2 className="text-section font-display font-bold tracking-tighter mb-10 text-foreground leading-[0.9]">
                {title}
              </h2>
              {description && (
                <p className="text-xl md:text-3xl text-muted-foreground font-medium leading-tight max-w-2xl">
                  {description}
                </p>
              )}
            </div>
            {ctaLabel && ctaUrl ? (
              <CMSLink 
                url={ctaUrl}
                label={ctaLabel}
                appearance="default"
                locale={locale}
                className="group flex items-center gap-4 text-2xl font-bold border-b-4 border-primary/20 pb-3 text-foreground hover:text-primary hover:border-primary transition-all"
              />
            ) : (
              <Link 
                href={`${localePrefix}/case-studies`} 
                className="group flex items-center gap-4 text-2xl font-bold border-b-4 border-primary/20 pb-3 text-foreground hover:text-primary hover:border-primary transition-all"
              >
                {locale === 'es' ? 'Ver todos los proyectos' : 'View all projects'}
                <ArrowUpRight className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform w-8 h-8 duration-500" />
              </Link>
            )}
          </m.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
            {displayWorks.map((work, i) => (
              <m.div 
                key={work.id}
                initial={{ opacity: 0, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ 
                  duration: 1.2, 
                  delay: i % 2 * 0.3, 
                  ease: [0.25, 0.1, 0.25, 1] 
                }}
                className="card-elevated group overflow-hidden border-t-[8px] border-t-primary/10 cursor-pointer"
              >
                <Link href={`${localePrefix}/case-studies/${work.slug}`} className="block relative aspect-[16/10] overflow-hidden">
                  {work.meta?.image && typeof work.meta.image === 'object' && (
                    <Media 
                      resource={work.meta.image} 
                      fill 
                      className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110" 
                    />
                  )}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/0 transition-colors duration-700 flex items-center justify-center">
                    <div className="w-20 h-20 bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 shadow-2xl">
                      <ArrowUpRight size={32} strokeWidth={3} />
                    </div>
                  </div>
                </Link>
                
                <div className="p-12">
                  <div className="flex justify-between items-start mb-8">
                    <h3 className="text-card-title font-bold font-display tracking-tight group-hover:text-primary transition-colors duration-500 leading-tight">
                      {work.title}
                    </h3>
                  </div>
                  <p className="text-xl md:text-2xl text-muted-foreground line-clamp-2 mb-12 leading-relaxed font-medium">
                    {work.meta?.description}
                  </p>
                  <Link 
                    href={`${localePrefix}/case-studies/${work.slug}`}
                    className="inline-flex items-center gap-4 text-xl font-bold text-primary group/link border-b-2 border-primary/20 hover:border-primary transition-all pb-2"
                  >
                    {locale === 'es' ? 'Ver detalles' : 'View details'} <ArrowUpRight className="group-hover/link:translate-x-2 group-hover/link:-translate-y-2 transition-transform duration-500" />
                  </Link>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>
    </LazyMotion>
  )
}
