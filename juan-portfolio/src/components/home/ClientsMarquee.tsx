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
    <div className="w-full relative overflow-hidden group">
      {/* Gradient masks for smooth fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-r from-background via-background/80 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none" />

      <div className="flex animate-marquee-infinite space-x-16 md:space-x-32 w-max py-8 hover:[animation-play-state:paused]">
        {displayClients.map((c: Cliente, i) => {
          const content = (
            <div
              className="flex justify-center items-center flex-shrink-0 w-48 md:w-80 h-32 md:h-48 
                         grayscale hover:grayscale-0 transition-all duration-700 ease-in-out 
                         opacity-40 hover:opacity-100 transform hover:scale-105"
            >
              {c.logo && typeof c.logo === 'object' && c.logo.url ? (
                <div
                  className={`
                    relative w-full h-full flex items-center justify-center p-6 
                    ${c.forceWhiteBackground ? 'bg-white rounded-lg' : ''}
                  `}
                >
                  <Image
                    src={c.logo.url}
                    alt={c.name || 'Logo'}
                    width={320}
                    height={180}
                    className={`
                      max-w-full max-h-full w-auto h-auto object-contain transition-all duration-500
                      ${c.invertInDark ? 'dark:invert' : ''}
                    `}
                  />
                </div>
              ) : (
                <span className="h-12 md:h-20 flex items-center font-display font-bold text-2xl md:text-3xl text-foreground/50 hover:text-primary transition-colors">
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
              >
                {content}
              </Link>
            )
          }

          return <div key={`${c.id}-${i}`}>{content}</div>
        })}
      </div>


    </div>
  )
}

export default ClientsMarquee

