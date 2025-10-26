import React from 'react'
import type { LatestCaseStudiesBlock, CaseStudy } from '@/payload-types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { Media } from '@/components/Media'

export const LatestCaseStudiesBlock: React.FC<LatestCaseStudiesBlock> = async ({
  title = 'Últimos casos de estudio',
  count = 3,
}) => {
  let cases: CaseStudy[] = []
  try {
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'case-studies',
      limit: count,
      sort: '-publishedAt',
      depth: 1,
    })
    cases = (res.docs as CaseStudy[]) || []
  } catch {
    cases = []
  }

  if (!cases.length) return null

  // Formato de fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <section className="py-20 md:py-28" id="latest-case-studies">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-current">{title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cases.map((cs) => (
            <div
              key={cs.id}
              className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group"
            >
              <Link href={`/case-studies/${cs.slug}`}>
                {cs.heroImage && (
                  <div className="w-full h-48 overflow-hidden">
                    <Media
                      resource={cs.heroImage}
                      className="w-full h-full object-cover"
                      imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {cs.publishedAt && formatDate(cs.publishedAt)}
                  </p>
                  <h3 className="text-lg font-bold text-current mb-2 group-hover:text-primary transition-colors">
                    {cs.title}
                  </h3>
                  {cs.meta?.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                      {cs.meta.description}
                    </p>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default LatestCaseStudiesBlock
