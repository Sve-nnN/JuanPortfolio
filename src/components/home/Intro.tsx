import React from 'react'
import type { Page } from '@/payload-types'

const Intro = ({ page }: { page?: Partial<Page> }) => {
  // Look for a content block or first content block in layout
  return (
    <section className="py-12 bg-white">
      <div className="max-w-4xl mx-auto px-6 prose">
        {/* Render a short intro if present in meta.description */}
        {page?.meta?.description ? <p>{page.meta.description}</p> : null}
      </div>
    </section>
  )
}

export default Intro
