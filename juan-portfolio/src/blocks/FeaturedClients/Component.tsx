import React from 'react'
import type { FeaturedClientsBlock, Client } from '@/payload-types'
import ClientsMarquee from '@/components/home/ClientsMarquee'

export const FeaturedClientsBlock: React.FC<FeaturedClientsBlock> = (props) => {
  const { title, clients, autoScroll = true } = props

  const clientList =
    clients && Array.isArray(clients)
      ? (clients.filter((c) => typeof c === 'object') as Client[])
      : []

  if (clientList.length === 0) return null

  return (
    <section className="py-20 md:py-28 bg-gray-50 dark:bg-card-dark">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-current">{title}</h2>
          </div>
        )}
        <ClientsMarquee clients={clientList} autoScroll={autoScroll} />
      </div>
    </section>
  )
}
