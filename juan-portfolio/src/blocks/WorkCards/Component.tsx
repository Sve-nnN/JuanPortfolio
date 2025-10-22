import React from 'react'
import Link from 'next/link'

type Props = {
  title?: string
  count?: number
  showReadMore?: boolean
}

export const WorkCardsBlock: React.FC<Props> = ({ title, count = 6, showReadMore = true }) => {
  return (
    <section>
      {title && <h2 className="text-2xl font-display font-bold mb-4">{title}</h2>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <article key={i} className="p-4 bg-card border border-default rounded">
            <h3 className="font-semibold">Work {i + 1}</h3>
            <p className="text-muted">Descripción editable en el admin</p>
            {showReadMore && (
              <Link href="#" className="text-primary inline-block mt-2">
                Leer más
              </Link>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export default WorkCardsBlock
