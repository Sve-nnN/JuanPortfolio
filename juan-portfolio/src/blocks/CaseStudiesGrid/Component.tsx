import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { CaseStudiesGridBlock, CaseStudy, Category } from '@/payload-types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const CaseStudiesGridBlock: React.FC<CaseStudiesGridBlock & { page?: number }> = async (
  props,
) => {
  const {
    itemsPerPage = 12,
    showCategories = true,
    gridColumns = '3',
    showExcerpt = true,
    showDate = false,
    page = 1,
  } = props

  // Fetch case studies
  let cases: CaseStudy[] = []
  let totalPages = 1

  try {
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'case-studies',
      limit: itemsPerPage,
      page,
      depth: 1,
      sort: '-publishedAt',
    })
    cases = (res.docs as CaseStudy[]) || []
    totalPages = res.totalPages
  } catch {
    cases = []
  }

  // Fetch categories if needed
  let categories: Category[] = []
  if (showCategories) {
    try {
      const payload = await getPayload({ config: configPromise })
      const res = await payload.find({
        collection: 'categories',
        limit: 100,
        pagination: false,
      })
      categories = (res.docs as Category[]) || []
    } catch {
      categories = []
    }
  }

  const gridColsClass = {
    '2': 'lg:grid-cols-2',
    '3': 'lg:grid-cols-3',
    '4': 'lg:grid-cols-4',
  }[gridColumns]

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Category Filters */}
      {showCategories && categories.length > 0 && (
        <div className="mb-12 flex flex-wrap justify-center gap-2">
          <button className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-full">
            Todo
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className="px-4 py-2 text-sm font-medium text-muted bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {cat.title}
            </button>
          ))}
        </div>
      )}

      {/* Case Studies Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-8`}>
        {cases.map((c) => {
          const heroUrl =
            c.heroImage && typeof c.heroImage === 'object' && 'url' in c.heroImage
              ? c.heroImage.url
              : null

          const heroAlt =
            c.heroImage && typeof c.heroImage === 'object' && 'alt' in c.heroImage
              ? c.heroImage.alt
              : c.title || ''

          return (
            <article
              key={c.id}
              className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group flex flex-col"
            >
              <Link
                className="block aspect-[4/3] overflow-hidden"
                href={`/case-studies/${c.slug || c.id}`}
              >
                {heroUrl ? (
                  <Image
                    src={heroUrl}
                    alt={heroAlt || ''}
                    width={1200}
                    height={800}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="bg-gray-100 dark:bg-card-dark w-full h-full"
                    style={{ minHeight: 200 }}
                  />
                )}
              </Link>
              <div className="p-6 flex flex-col flex-grow">
                {/* Categories */}
                <div className="mb-3">
                  {c.categories &&
                    Array.isArray(c.categories) &&
                    c.categories.slice(0, 2).map((cat, i) => {
                      const category = typeof cat === 'object' ? cat : null
                      const catTitle =
                        category && 'title' in category ? (category.title as string) : String(cat)
                      return (
                        <span
                          key={i}
                          className="inline-block bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full mr-2"
                        >
                          {catTitle}
                        </span>
                      )
                    })}
                </div>

                {/* Date */}
                {showDate && c.publishedAt && (
                  <p className="text-sm text-muted mb-2">
                    {new Date(c.publishedAt).toLocaleDateString()}
                  </p>
                )}

                {/* Title */}
                <h2 className="text-xl font-bold text-current mb-2 group-hover:text-primary transition-colors">
                  <Link href={`/case-studies/${c.slug || c.id}`}>{c.title}</Link>
                </h2>

                {/* Excerpt */}
                {showExcerpt && c.meta?.description && (
                  <p className="text-muted flex-grow mb-4 line-clamp-3">{c.meta.description}</p>
                )}

                {/* Read more */}
                <Link
                  href={`/case-studies/${c.slug || c.id}`}
                  className="text-primary font-semibold group-hover:underline mt-auto"
                >
                  Ver caso de estudio →
                </Link>
              </div>
            </article>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex justify-center gap-2">
          <p className="text-muted">
            Página {page} de {totalPages}
          </p>
        </div>
      )}
    </div>
  )
}
