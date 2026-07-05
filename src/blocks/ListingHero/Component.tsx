import React from 'react'
import type { ListingHeroBlock } from '@/payload-types'
import Link from 'next/link'

export const ListingHero: React.FC<ListingHeroBlock & { locale?: 'en' | 'es' }> = ({
  title,
  description,
  breadcrumbs,
  locale: _locale = 'es'
}) => {
  return (
    <section className="relative pt-24 pb-12 md:pt-40 md:pb-20 overflow-hidden bg-background">
      <div className="container relative z-10 mx-auto px-4">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-8">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {crumb.url ? (
                  <Link href={crumb.url} className="hover:text-primary transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
                {i < breadcrumbs.length - 1 && <span className="opacity-50">/</span>}
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="max-w-5xl">
          <h1 className="text-display font-display font-bold tracking-tighter mb-10 leading-[0.85] text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-xl md:text-3xl lg:text-4xl text-muted-foreground leading-tight max-w-3xl font-medium">
              {description}
            </p>
          )}
        </div>
      </div>
      
      {/* Visual background element */}
      <div className="absolute top-0 right-0 -z-10 opacity-30 dark:opacity-20 pointer-events-none translate-x-1/3 -translate-y-1/4">
        <div className="w-[800px] h-[800px] rounded-full bg-primary blur-[160px]" />
      </div>
    </section>
  )
}
