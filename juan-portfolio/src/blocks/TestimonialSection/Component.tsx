import React from 'react'
import type { TestimonialSectionBlock } from '@/payload-types'
import { Media } from '@/components/Media'
import { Quote } from 'lucide-react'

export const TestimonialSectionBlock: React.FC<TestimonialSectionBlock> = (props) => {
  const { title, quote, authorName, authorRole, authorImage } = props

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {title && (
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-current">{title}</h2>
            </div>
          )}
          <div className="mt-12 bg-card rounded-xl shadow-lg relative p-8">
            {/* Quote icon decorative */}
            <div className="absolute top-2 left-2 -translate-x-4 -translate-y-4 text-primary/10">
              <Quote className="w-16 h-16" strokeWidth={1.5} />
            </div>

            <blockquote className="text-xl text-gray-700 dark:text-gray-300 italic leading-relaxed relative z-10">
              {quote}
            </blockquote>

            <div className="mt-8 flex items-center">
              {authorImage && typeof authorImage === 'object' && (
                <div className="w-16 h-16 rounded-full overflow-hidden shadow-md flex-shrink-0">
                  <Media
                    resource={authorImage}
                    className="w-full h-full object-cover"
                    imgClassName="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="ml-4">
                <p className="font-bold text-current text-lg">{authorName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{authorRole}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
