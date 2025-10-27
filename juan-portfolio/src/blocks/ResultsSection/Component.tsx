import React from 'react'
import type { ResultsSectionBlock } from '@/payload-types'

export const ResultsSection: React.FC<ResultsSectionBlock> = (props) => {
  const { title, description, stats, backgroundColor = 'gray' } = props

  const bgColorClass =
    backgroundColor === 'gray'
      ? 'bg-gray-50 dark:bg-card-dark'
      : backgroundColor === 'primary'
        ? 'bg-primary/5 dark:bg-primary/10'
        : 'bg-white dark:bg-card'

  return (
    <section className={`py-20 md:py-28 ${bgColorClass}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-current">{title}</h2>
            {description && (
              <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">{description}</p>
            )}
          </div>

          {stats && stats.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-card p-6 rounded-lg shadow-lg text-center transform hover:scale-105 transition-transform duration-300"
                >
                  <span className="text-5xl font-bold text-primary gradient-text block mb-2">
                    {stat.value}
                  </span>
                  <p className="text-lg font-semibold text-current">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
