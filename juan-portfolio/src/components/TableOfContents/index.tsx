'use client'

import React from 'react'
import type { Heading } from '@/utilities/extractHeadings'

export const TableOfContents: React.FC<{ headings: Heading[] }> = ({ headings }) => {
  if (!headings || headings.length === 0) return null

  return (
    <nav
      aria-label="Tabla de contenido"
      className="mb-6 border p-4 rounded-lg bg-card border-gray-200 dark:border-slate-700 shadow-sm lg:mb-0"
    >
      <p className="text-sm font-semibold mb-3 text-current flex items-center">
        <span className="w-1 h-4 bg-primary mr-2 rounded"></span>
        Contenido
      </p>
      <ul className="space-y-1.5 text-sm">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 2 ? 'pl-0' : h.level === 3 ? 'pl-4' : 'pl-8'}>
            <a
              href={`#${h.id}`}
              className="block text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-all duration-200 px-2 py-1.5 rounded-md hover:bg-primary/5 dark:hover:bg-primary/10"
              onClick={(e) => {
                e.preventDefault()
                const target = document.getElementById(h.id)
                if (target) {
                  const offset = 100 // offset for fixed header
                  const targetPosition = target.offsetTop - offset
                  window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth',
                  })
                  // Update URL without jumping
                  window.history.pushState(null, '', `#${h.id}`)
                }
              }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
