import React from 'react'
import Link from 'next/link'

type Props = {
  title?: string
  count?: number
  showReadMore?: boolean
  locale?: 'en' | 'es'
}

export const WorkCardsBlock: React.FC<Props> = ({ title, count = 6, showReadMore = true, locale = 'es' }) => {
  const localePrefix = locale === 'es' ? '' : '/en'
  
  return (
    <section className="py-12 md:py-24">
      {title && <h2 className="text-section font-display font-bold mb-12 tracking-tight">{title}</h2>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
        {Array.from({ length: count }).map((_, i) => (
          <article key={i} className="card-elevated p-8 group border-t-[6px] border-t-primary/10">
            <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">Work {i + 1}</h3>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed font-medium">Descripción editable en el admin</p>
            {showReadMore && (
              <Link href={`${localePrefix}/`} className="text-primary font-bold text-lg inline-flex items-center gap-2 border-b-2 border-primary/20 hover:border-primary transition-all pb-1">
                {locale === 'es' ? 'Leer más' : 'Read more'}
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export default WorkCardsBlock
