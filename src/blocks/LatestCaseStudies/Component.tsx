import React from 'react'
import type { LatestCaseStudiesBlock, CaseStudy } from '@/payload-types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { Media } from '@/components/Media'
import { ArrowRight } from 'lucide-react'

export const LatestCaseStudies: React.FC<LatestCaseStudiesBlock & { locale?: 'en' | 'es' }> = async ({
  title,
  count = 3,
  locale = 'es',
}) => {
  const displayTitle = title || (locale === 'es' ? 'Últimos casos de estudio' : 'Latest case studies')
  let cases: CaseStudy[] = []
  try {
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'case-studies',
      limit: count || 3,
      sort: '-publishedAt',
      depth: 2,
      locale,
      where: {
        _status: {
          equals: 'published',
        },
      },
    })
    cases = (res.docs as CaseStudy[]) || []
  } catch {
    cases = []
  }

  // Formato de fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const localePrefix = locale === 'es' ? '' : '/en'

  return (
    <section className="py-16 md:py-20 bg-background" id="latest-case-studies">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-section font-display font-bold text-foreground mb-8 leading-[1.1] tracking-tight">
            {displayTitle}
          </h2>
        </div>

        {cases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
            {cases.map((cs) => (
              <div key={cs.id} className="card-elevated group flex flex-col h-full overflow-hidden border-t-[6px] border-t-primary/10 cursor-pointer">
                <Link href={`${localePrefix}/case-studies/${cs.slug}`} className="block overflow-hidden relative aspect-[4/3] bg-muted">
                  {cs.content?.heroImage && (
                    <Media
                      resource={cs.content.heroImage}
                      fill
                      className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500" />
                </Link>

                <div className="flex flex-col flex-grow p-8">
                  <div className="text-xs text-primary font-bold uppercase tracking-widest mb-4 bg-primary/10 w-fit px-2.5 py-1 rounded-full">
                    {cs.publishedAt && formatDate(cs.publishedAt)}
                  </div>
                  <h3 className="text-card-title font-bold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                    <Link href={`${localePrefix}/case-studies/${cs.slug}`}>{cs.title}</Link>
                  </h3>
                  {cs.meta?.description && (
                    <p className="text-base text-muted-foreground mb-8 line-clamp-3 leading-relaxed font-medium">
                      {cs.meta.description}
                    </p>
                  )}
                  <div className="mt-auto">
                    <Link href={`${localePrefix}/case-studies/${cs.slug}`} className="inline-flex items-center text-primary font-bold text-lg group/link border-b-2 border-primary/20 hover:border-primary transition-all pb-1">
                      {locale === 'es' ? 'Leer caso' : 'Read case'}
                      <ArrowRight className="ml-2 w-5 h-5 transition-transform duration-300 group-hover/link:translate-x-2" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-[2rem] border border-border/50 shadow-inner">
            <p className="text-muted-foreground text-xl font-medium leading-relaxed">
              {locale === 'es' ? 'No se encontraron casos de estudio recientes.' : 'No recently published case studies found.'}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default LatestCaseStudies
