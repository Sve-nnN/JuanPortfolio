import React from 'react'
import type { LatestCaseStudiesBlock, CaseStudy } from '@/payload-types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { Media } from '@/components/Media'
import { ArrowRight } from 'lucide-react'

export const LatestCaseStudies: React.FC<LatestCaseStudiesBlock> = async ({
  title = 'Últimos casos de estudio',
  count = 3,
}) => {
  let cases: CaseStudy[] = []
  try {
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'case-studies',
      limit: count || 3,
      sort: '-publishedAt',
      depth: 2,
    })
    cases = (res.docs as CaseStudy[]) || []
  } catch {
    cases = []
  }

  // if (!cases.length) return null

  // Formato de fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <section className="py-24 md:py-32" id="latest-case-studies">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6 leading-tight">
            {title}
          </h2>
        </div>

        {cases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {cases.map((cs) => (
              <div key={cs.id} className="group flex flex-col h-full">
                <Link href={`/case-studies/${cs.slug}`} className="block overflow-hidden rounded-2xl mb-6 relative aspect-[4/3] bg-muted">
                  {cs.content?.heroImage && (
                    <Media
                      resource={cs.content.heroImage}
                      fill
                      className="w-full h-full object-cover transition-transform duration-700 ease-&lsqb;cubic-bezier(0.25,1,0.5,1)&rsqb; group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </Link>

                <div className="flex flex-col flex-grow">
                  <div className="text-sm text-primary font-medium mb-3">
                    {cs.publishedAt && formatDate(cs.publishedAt)}
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    <Link href={`/case-studies/${cs.slug}`}>{cs.title}</Link>
                  </h3>
                  {cs.meta?.description && (
                    <p className="text-muted-foreground mb-6 line-clamp-3">
                      {cs.meta.description}
                    </p>
                  )}
                  <div className="mt-auto">
                    <Link href={`/case-studies/${cs.slug}`} className="inline-flex items-center text-primary font-semibold group/link">
                      <span className="border-b-2 border-transparent group-hover/link:border-primary transition-colors pb-0.5">
                        Leer caso
                      </span>
                      <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-2xl">
            <p className="text-muted-foreground text-lg">No se encontraron casos de estudio recientes.</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default LatestCaseStudies
