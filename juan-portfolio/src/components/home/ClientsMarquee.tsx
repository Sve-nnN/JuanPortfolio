import React from 'react'
import Image from 'next/image'
import type { Client } from '@/payload-types'

const ClientsMarquee = async () => {
  const configPromise = (await import('@payload-config')).default
  const { getPayload } = await import('payload')

  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({
    collection: 'clients',
    limit: 50,
    pagination: false,
    sort: 'order',
  })
  const clients = res.docs || []

  // Duplicate clients to ensure smooth infinite loop if we have enough items
  // If few items, duplicate more times
  const repeatCount = clients.length < 5 ? 4 : 2
  const displayClients = Array(repeatCount).fill(clients).flat()

  return (
    <div className="w-full relative overflow-hidden">
      {/* Gradient masks for smooth fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-background to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-background to-transparent" />

      <div className="flex animate-marquee-infinite space-x-12 md:space-x-24 w-max hover:[animation-play-state:paused]">
        {displayClients.map((c: Client, i) => (
          <div key={`${c.id}-${i}`} className="flex justify-center items-center flex-shrink-0 w-32 md:w-40 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100 cursor-pointer">
            {c.logo && typeof c.logo === 'object' && c.logo.url ? (
              <Image
                src={c.logo.url}
                alt={c.name || 'Logo'}
                width={160}
                height={60}
                className="h-8 md:h-12 w-auto object-contain dark:invert"
              />
            ) : (
              <span className="h-8 md:h-12 flex items-center font-bold text-xl">{c.name}</span>
            )}
          </div>
        ))}
      </div>
      <style>{`@keyframes marquee-infinite { 0% { transform: translateX(0);} 100% { transform: translateX(-50%);} } .animate-marquee-infinite { animation: marquee-infinite 30s linear infinite; }`}</style>
    </div>
  )
}

export default ClientsMarquee
