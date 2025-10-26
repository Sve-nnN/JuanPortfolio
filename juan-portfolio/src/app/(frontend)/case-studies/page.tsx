import React from 'react'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { getCachedGlobal } from '@/utilities/getGlobals'

const CaseStudiesPage = async () => {
  // Get case studies listing global with blocks
  let caseStudiesGlobal: any = null
  try {
    caseStudiesGlobal = await getCachedGlobal('case-studies-listing')()
  } catch {
    // Fallback if global not found
  }

  // If global has layout blocks, render them
  if (
    caseStudiesGlobal?.layout &&
    Array.isArray(caseStudiesGlobal.layout) &&
    caseStudiesGlobal.layout.length > 0
  ) {
    return (
      <main>
        <RenderBlocks blocks={caseStudiesGlobal.layout} />
      </main>
    )
  }

  // Fallback UI if no blocks configured
  return (
    <main className="py-20">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">
          {caseStudiesGlobal?.title || 'Casos de estudio'}
        </h1>
        <p className="text-center text-muted">
          Please configure blocks in the Case Studies Listing global in Payload admin.
        </p>
      </div>
    </main>
  )
}

export default CaseStudiesPage
