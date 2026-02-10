'use client'

import React from 'react'
import Image from 'next/image'
import type { Cliente } from '@/payload-types'
import Link from 'next/link'

interface ClientsMarqueeProps {
  clients?: Cliente[]
}

const ClientsMarquee: React.FC<ClientsMarqueeProps> = ({ clients = [] }) => {
  // If no clients provided, we might want to show a message or fetch them.
  // For now, assume they are passed from the server component block.
  if (!clients || clients.length === 0) return null

  // Duplicate clients to ensure smooth infinite loop
  const repeatCount = clients.length < 6 ? 4 : 2
  const displayClients = Array(repeatCount).fill(clients).flat()

  return (
    <div className="w-full relative overflow-hidden group bg-white py-8 md:py-16 lg:py-20 rounded-3xl border border-slate-100 shadow-sm">
      {/* Gradient masks for smooth fade edges - Light Mode Optimized */}
      <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 z-10 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 z-10 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none" />

      <div className="flex animate-marquee-infinite space-x-10 sm:space-x-16 md:space-x-24 lg:space-x-32 w-max py-2 md:py-4 hover:[animation-play-state:paused]">
        {displayClients.map((c: Cliente, i) => {
          const content = (
            <div
              className="flex justify-center items-center flex-shrink-0 
                         w-32 sm:w-40 md:w-52 lg:w-64 
                         h-20 sm:h-24 md:h-28 lg:h-32 
                         grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-all duration-500 ease-in-out 
                         transform hover:scale-110"
            >
              {c.logo && typeof c.logo === 'object' && c.logo.url ? (
                <div
                  className={`
                    relative w-full h-full flex items-center justify-center p-2 sm:p-3 md:p-4
                    ${c.forceWhiteBackground ? 'bg-white rounded-xl shadow-sm border border-slate-50' : ''}
                  `}
                >
                  <Image
                    src={c.logo.url}
                    alt={c.name || 'Logo'}
                    width={280}
                    height={140}
                    className="max-w-full max-h-full w-auto h-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
                  />
                </div>
              ) : (
                <span className="h-10 sm:h-12 md:h-16 lg:h-20 flex items-center font-display font-bold text-base sm:text-lg md:text-xl lg:text-2xl text-slate-400 hover:text-primary transition-colors tracking-tight">
                  {c.name}
                </span>
              )}
            </div>
          )

          if (c.url) {
            return (
              <Link
                key={`${c.id}-${i}`}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
                aria-label={`Visitar sitio web de ${c.name}`}
              >
                {content}
              </Link>
            )
          }

          return <div key={`${c.id}-${i}`} aria-hidden="true">{content}</div>
        })}
      </div>
    </div>
  )
}

export default ClientsMarquee

