import React from 'react'
import type { FeaturedWorksBlock, CaseStudy } from '@/payload-types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { Media } from '@/components/Media'
import { ArrowUpRight } from 'lucide-react'
import { CMSLink } from '@/components/Link'

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
    <section className="py-24 md:py-32" id="works">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-5xl md:text-7xl font-array font-bold tracking-tighter mb-6">
              {title}
            </h2>
            {description && (
              <p className="text-xl text-muted-foreground font-medium">
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
              className="group flex items-center gap-2 text-lg font-bold border-b-2 border-primary pb-1"
            />
          ) : (
            <Link 
              href={`${localePrefix}/case-studies`} 
              className="group flex items-center gap-2 text-lg font-bold border-b-2 border-primary pb-1"
            >
              {locale === 'es' ? 'Ver todos los proyectos' : 'View all projects'}
              <ArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {displayWorks.map((work) => (
            <div key={work.id} className="group relative bg-card rounded-3xl overflow-hidden border border-border transition-all hover:border-primary/50">
              <Link href={`${localePrefix}/case-studies/${work.slug}`} className="block relative aspect-[16/10] overflow-hidden">
                {work.meta?.image && typeof work.meta.image === 'object' && (
                  <Media 
                    resource={work.meta.image} 
                    fill 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
              </Link>
              
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-3xl font-bold font-array tracking-tight group-hover:text-primary transition-colors">
                    {work.title}
                  </h3>
                </div>
                <p className="text-lg text-muted-foreground line-clamp-2 mb-8">
                  {work.meta?.description}
                </p>
                <Link 
                  href={`${localePrefix}/case-studies/${work.slug}`}
                  className="inline-flex items-center gap-2 font-bold text-primary"
                >
                  {locale === 'es' ? 'Ver detalles' : 'View details'} <ArrowUpRight size={18} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
