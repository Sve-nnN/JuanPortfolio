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
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {caseStudies.map((cs) => (
          <div key={cs.id} className="card-elevated group flex flex-col h-full overflow-hidden border-t-[6px] border-t-primary/10 cursor-pointer">
            <Link href={`${localePrefix}/case-studies/${cs.slug}`} className="block relative aspect-video overflow-hidden">
              {cs.content?.heroImage && (
                <Media
                  resource={cs.content.heroImage}
                  fill
                  className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                />
              )}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500 flex items-end p-8">
                <span className="text-white font-bold text-xl flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                  {locale === 'es' ? 'Ver proyecto' : 'View project'} <ArrowRight size={24} />
                </span>
              </div>
            </Link>
            
            <div className="p-10 flex flex-col flex-grow">
              <h3 className="text-3xl md:text-4xl font-display font-bold mb-6 group-hover:text-primary transition-colors duration-300">
                <Link href={`${localePrefix}/case-studies/${cs.slug}`}>{cs.title}</Link>
              </h3>
              {cs.meta?.description && (
                <p className="text-lg md:text-xl text-muted-foreground line-clamp-2 mb-10 leading-relaxed font-medium">
                  {cs.meta.description}
                </p>
              )}
              <div className="mt-auto">
                <Link 
                  href={`${localePrefix}/case-studies/${cs.slug}`}
                  className="text-lg font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-3 group/link border-b-2 border-primary/20 hover:border-primary transition-all pb-1 w-fit"
                >
                  {locale === 'es' ? 'Explorar caso de estudio' : 'Explore case study'}
                  <ArrowRight size={20} className="group-hover/link:translate-x-2 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
