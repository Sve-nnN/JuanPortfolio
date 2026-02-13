import React from 'react'
import type { CaseStudiesGridBlock, CaseStudy } from '@/payload-types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { Media } from '@/components/Media'
import { ArrowRight } from 'lucide-react'

export const CaseStudiesGrid: React.FC<CaseStudiesGridBlock & { locale?: 'en' | 'es' }> = async (props) => {
  const { itemsPerPage = 6, locale = 'es' } = props

  let caseStudies: CaseStudy[] = []
  try {
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'case-studies',
      limit: itemsPerPage || 6,
      sort: '-publishedAt',
      depth: 1,
      locale,
      where: {
        _status: {
          equals: 'published',
        },
      },
    })
    caseStudies = (res.docs as CaseStudy[]) || []
  } catch {
    caseStudies = []
  }

  const localePrefix = locale === 'es' ? '' : '/en'

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {caseStudies.map((cs) => (
          <div key={cs.id} className="group relative flex flex-col h-full bg-card rounded-2xl overflow-hidden border border-border transition-all hover:shadow-xl">
            <Link href={`${localePrefix}/case-studies/${cs.slug}`} className="block relative aspect-video overflow-hidden">
              {cs.content?.heroImage && (
                <Media
                  resource={cs.content.heroImage}
                  fill
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <span className="text-white font-bold flex items-center gap-2">
                  {locale === 'es' ? 'Ver proyecto' : 'View project'} <ArrowRight size={18} />
                </span>
              </div>
            </Link>
            
            <div className="p-6 flex flex-col flex-grow">
              <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                <Link href={`${localePrefix}/case-studies/${cs.slug}`}>{cs.title}</Link>
              </h3>
              {cs.meta?.description && (
                <p className="text-muted-foreground line-clamp-2 mb-6">
                  {cs.meta.description}
                </p>
              )}
              <div className="mt-auto">
                <Link 
                  href={`${localePrefix}/case-studies/${cs.slug}`}
                  className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2"
                >
                  {locale === 'es' ? 'Explorar caso de estudio' : 'Explore case study'}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
