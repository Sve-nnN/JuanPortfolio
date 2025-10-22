import React from 'react'
import type { Heading } from '@/utilities/extractHeadings'

export const TableOfContents: React.FC<{ headings: Heading[] }> = ({ headings }) => {
  if (!headings || headings.length === 0) return null

  return (
    <nav
      aria-label="Tabla de contenido"
      className="mb-6 border p-4 rounded bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
    >
      <p className="text-sm font-semibold mb-2 text-current">Contenido</p>
      <ul className="space-y-1 text-sm">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 2 ? 'pl-0' : h.level === 3 ? 'pl-4' : 'pl-8'}>
            <a
              href={`#${h.id}`}
              className="block text-muted hover:text-primary dark:hover:text-primary transition-colors px-2 py-1 rounded-sm"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
