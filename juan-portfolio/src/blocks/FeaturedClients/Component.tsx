import React from 'react'
import type { FeaturedClientsBlock } from '@/payload-types'
import ClientsMarquee from '@/components/home/ClientsMarquee'

export const FeaturedClients: React.FC<FeaturedClientsBlock> = (props) => {
  const { title } = props

  return (
    <section className="py-20 md:py-28 bg-gray-50 dark:bg-card-dark">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-current">{title}</h2>
          </div>
        )}
        <ClientsMarquee />
      </div>
    </section>
  )
}
