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

  return (
    <div className="py-16 bg-gray-50 dark:bg-card-dark overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-center text-2xl font-display font-bold text-current mb-12">
          He colaborado con empresas increíbles
        </h3>
        <div className="relative">
          <div className="flex animate-marquee-infinite space-x-16">
            {clients.map((c: Client) => (
              <div key={c.id} className="flex justify-center items-center flex-shrink-0 w-40">
                {c.logo && typeof c.logo === 'object' && c.logo.url ? (
                  <Image
                    src={c.logo.url}
                    alt={c.name || 'Logo'}
                    width={160}
                    height={40}
                    className="h-10 opacity-70 hover:opacity-100 transition-opacity dark:invert"
                  />
                ) : (
                  <span className="h-10 opacity-70">{c.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes marquee-infinite { 0% { transform: translateX(0);} 100% { transform: translateX(-50%);} } .animate-marquee-infinite { animation: marquee-infinite 30s linear infinite; }`}</style>
    </div>
  )
}

export default ClientsMarquee
