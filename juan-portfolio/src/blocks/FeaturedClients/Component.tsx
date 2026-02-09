import React from 'react'
import type { FeaturedClientsBlock, Cliente } from '@/payload-types'
import ClientsMarquee from '@/components/home/ClientsMarquee'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const FeaturedClients: React.FC<FeaturedClientsBlock> = async (props) => {
  const { title, clients: selectedClients } = props

  let clients: Cliente[] = []

  if (selectedClients && selectedClients.length > 0) {
    // We already have the IDs or the objects depending on depth
    // In this template usually relationship fields are just IDs unless depth is set.
    // However, blocks often come with populated data if called through the right utility.
    // Let's ensure we have full objects.
    const payload = await getPayload({ config: configPromise })
    const fetchedClients = await payload.find({
      collection: 'clientes' as any, // TODO: Update to 'clientes' after type generation
      where: {
        id: {
          in: selectedClients.map((c) => (typeof c === 'string' ? c : c.id)),
        },
      },
      // sort: 'order',
    })
    clients = fetchedClients.docs as unknown as Cliente[]
  } else {
    // Fallback: fetch all if none selected
    const payload = await getPayload({ config: configPromise })
    const fetchedClients = await payload.find({
      collection: 'clientes' as any, // TODO: Update to 'clientes' after type generation
      limit: 50,
      pagination: false,
      // sort: 'order',
    })
    clients = fetchedClients.docs as unknown as Cliente[]
  }

  return (
    <section className="py-20 md:py-32 bg-secondary/10 border-y border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-wider uppercase text-xs mb-3 block">
              Trusted By
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground opacity-90">
              {title}
            </h2>
          </div>
        )}
        <ClientsMarquee clients={clients} />
      </div>
    </section>
  )
}

