import React from 'react'
import type { FeaturedClientsBlock } from '@/payload-types'
import ClientsMarquee from '@/components/home/ClientsMarquee'

export const FeaturedClients: React.FC<FeaturedClientsBlock> = (props) => {
  const { title } = props

  return (
    <section className="py-20 md:py-32 bg-secondary/10 border-y border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-wider uppercase text-xs mb-3 block">
              Trusted By
            </span>
            <h2 className="text-2xl md:text-3xl font-display font-semibold text-foreground opacity-90">
              {title}
            </h2>
          </div>
        )}
        <ClientsMarquee />
      </div>
    </section>
  )
}
