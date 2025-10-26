import React from 'react'
import { TableOfContents } from '@/components/TableOfContents'
import type { TableOfContentsBlock } from '@/payload-types'

export const TableOfContentsBlockComponent: React.FC<
  TableOfContentsBlock & { headings?: any[] }
> = (props) => {
  const { title, sticky = true, headings = [] } = props

  if (headings.length === 0) return null

  return (
    <aside>
      <div className={sticky ? 'sticky top-24 max-h-[calc(100vh-6rem)] overflow-auto' : ''}>
        {title && <h3 className="text-lg font-bold mb-4">{title}</h3>}
        <TableOfContents headings={headings} />
      </div>
    </aside>
  )
}
