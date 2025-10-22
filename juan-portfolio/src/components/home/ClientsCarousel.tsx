import React from 'react'
import type { Client } from '@/payload-types'
import ClientsCarouselClient from './ClientsCarousel.client'

const ClientsCarousel = async () => {
  // Import server-only modules inside the server function so they are not
  // bundled into client code paths. This prevents pulling `payload.config` and
  // other server-only hooks (like revalidateTag) into client bundles.
  const configPromise = (await import('@payload-config')).default
  const { getPayload } = await import('payload')

  let clients: Client[] = []

  try {
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'clients',
      limit: 50,
      pagination: false,
      sort: 'order',
    })
    clients = (res.docs as Client[]) || []
  } catch (_err) {
    // If Payload or Mongo isn't available in dev, fallback to a small mock
    // set so the UI remains visible for frontend work.
    clients = [
      {
        id: 'mock-1',
        name: 'Acme',
        logo: { url: '/media/image-hero1-300x169.webp' },
      } as unknown as Client,
      {
        id: 'mock-2',
        name: 'Globex',
        logo: { url: '/media/image-post1-300x169.webp' },
      } as unknown as Client,
      {
        id: 'mock-3',
        name: 'Initech',
        logo: { url: '/media/image-post2-300x169.webp' },
      } as unknown as Client,
    ]
  }

  return <ClientsCarouselClient clients={clients} />
}

export default ClientsCarousel
