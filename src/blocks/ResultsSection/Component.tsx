import React from 'react'
import type { ResultsSectionBlock } from '@/payload-types'

export const ResultsSection: React.FC<ResultsSectionBlock & { locale?: 'en' | 'es' }> = (props) => {
  const { title, description, stats, locale: _locale = 'es' } = props

  return (
    <section className={`py-24 md:py-32 bg-background`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-section font-display font-bold text-foreground leading-[1.1] tracking-tight">{title}</h2>
            {description && (
              <p className="mt-6 text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">{description}</p>
            )}
          </div>

          {stats && stats.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="card-elevated p-10 text-center group cursor-default border-t-[6px] border-t-primary/10"
                >
                  <span className="text-6xl md:text-7xl font-bold text-primary block mb-4 tracking-tighter transition-transform duration-500 group-hover:scale-110">
                    {stat.value}
                  </span>
                  <p className="text-lg md:text-xl font-bold text-foreground uppercase tracking-widest leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
