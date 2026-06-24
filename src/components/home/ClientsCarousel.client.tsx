'use client'
import React from 'react'
import { Splide, SplideSlide } from '@splidejs/react-splide'
import Image from 'next/image'
import type { Cliente } from '@/payload-types'

import '@splidejs/splide/dist/css/splide.min.css'

export default function ClientsCarousel({ clients }: { clients: Cliente[] }) {
  if (!clients || !clients.length) return null

  return (
    <div className="py-16 bg-background-light dark:bg-card-dark">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-center text-2xl font-display font-bold text-current mb-8">
          He colaborado con empresas increíbles
        </h3>

        <Splide
          options={{
            type: 'loop',
            perPage: 5,
            gap: '1.5rem',
            autoplay: true,
            pauseOnHover: true,
            breakpoints: {
              1024: { perPage: 4 },
              768: { perPage: 3 },
              480: { perPage: 2 },
            },
          }}
          aria-label="Clientes"
        >
          {clients.map((c) => (
            <SplideSlide key={c.id}>
              <div
                className={`
                  flex justify-center items-center h-20 p-2 
                  ${c.forceWhiteBackground ? 'bg-white rounded-md' : ''}
                `}
              >
                {c.logo && typeof c.logo === 'object' && c.logo.url ? (
                  <Image
                    src={c.logo.url}
                    alt={c.name || 'Logo'}
                    width={160}
                    height={40}
                    className={`
                      h-10 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity 
                      ${c.invertInDark ? 'dark:invert' : ''}
                    `}
                    unoptimized={/\.(avif|webp)$/i.test(c.logo.url)}
                  />
                ) : (
                  <span className="opacity-80">{c.name}</span>
                )}
              </div>
            </SplideSlide>
          ))}
        </Splide>
      </div>
    </div>
  )
}
