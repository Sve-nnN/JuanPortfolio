import React from 'react'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import type { Work } from '@/payload-types'

const WorkCards = async () => {
  let items: Work[] = []
  try {
    const configPromise = (await import('@payload-config')).default
    const { getPayload } = await import('payload')

    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'case-studies',
      limit: 6,
      pagination: false,
      sort: '-createdAt',
    })
    items = (result.docs as Work[]) || []
  } catch (_err) {
    // Fallback mock data when Payload / Mongo is unavailable (dev)
    items = [
      {
        id: 'mock-1',
        title: 'Proyecto de ejemplo',
        excerpt: 'Descripción breve del proyecto de ejemplo para desarrollo local.',
        cover: undefined,
      } as unknown as Work,
    ]
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {items.map((w) => (
        <div
          key={w.id}
          className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 group"
        >
          <a href={w.caseStudyUrl || '#'}>
            {w.cover && typeof w.cover === 'object' && w.cover?.url ? (
              <div className="relative w-full h-64">
                <Image
                  src={w.cover.url}
                  alt={
                    (w.cover && typeof w.cover === 'object' && 'alt' in w.cover
                      ? (w.cover as { alt?: string }).alt
                      : w.title) || ''
                  }
                  fill
                  className="object-cover"
                />
              </div>
            ) : null}
            <div className="p-6">
              <h3 className="text-xl font-bold text-current mb-2">{w.title}</h3>
              {w.excerpt ? <p className="text-muted mb-4">{w.excerpt}</p> : null}
              <div className="flex flex-wrap gap-2 mb-4">
                {w.tags?.map((t, i) => (
                  <span
                    key={i}
                    className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full"
                  >
                    {t.label}
                  </span>
                ))}
              </div>
              <span className="text-primary font-semibold group-hover:underline">
                Ver caso de estudio <ArrowRight className="inline align-middle" size={16} />
              </span>
            </div>
          </a>
        </div>
      ))}
    </div>
  )
}

export default WorkCards
