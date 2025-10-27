import React from 'react'
import Link from 'next/link'
import type { ListingHeroBlock } from '@/payload-types'

export const ListingHero: React.FC<ListingHeroBlock> = (props) => {
  const { title, description, breadcrumbs } = props

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-8">
            <nav aria-label="Breadcrumb" className="text-sm font-medium text-muted">
              <ol className="list-none p-0 inline-flex">
                {breadcrumbs.map((crumb, i) => (
                  <li key={i} className="flex items-center">
                    {crumb.url ? (
                      <Link className="hover:text-primary" href={crumb.url}>
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-current">{crumb.label}</span>
                    )}
                    {i < breadcrumbs.length - 1 && <span className="text-base mx-2">/</span>}
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        )}

        {/* Title and Description */}
        <div className="text-center mb-12 md:mb-16">
          {title && (
            <h1 className="text-4xl md:text-6xl font-display font-bold text-current mb-4">
              {title}
            </h1>
          )}
          {description && <p className="max-w-3xl mx-auto text-lg text-muted">{description}</p>}
        </div>
      </div>
    </section>
  )
}
