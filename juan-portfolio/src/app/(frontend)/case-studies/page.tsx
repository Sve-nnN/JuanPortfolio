/**
 * @file Defines the main case studies listing page.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import React from 'react'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { getCachedGlobal } from '@/utilities/getGlobals'

/**
 * The main case studies listing page component.
 * It fetches the 'case-studies-listing' global from the CMS and renders its blocks.
 * If no blocks are configured, it displays a fallback message.
 * @returns {Promise<React.ReactElement>} A promise that resolves to the case studies page component.
 */
const CaseStudiesPage = async () => {
  // Get case studies listing global with blocks
  const caseStudiesGlobal = await getCachedGlobal('case-studies-listing')().catch(() => null)

  // If global has layout blocks, render them
  if (
    caseStudiesGlobal &&
    'layout' in caseStudiesGlobal &&
    Array.isArray(caseStudiesGlobal.layout) &&
    caseStudiesGlobal.layout.length > 0
  ) {
    return (
      <main>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <RenderBlocks blocks={caseStudiesGlobal.layout as any} />
      </main>
    )
  }

  // Fallback UI if no blocks configured
  const title =
    caseStudiesGlobal && 'title' in caseStudiesGlobal ? caseStudiesGlobal.title : 'Casos de estudio'
  return (
    <main className="py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">{title}</h1>
        <p className="text-center text-muted">
          Please configure blocks in the Case Studies Listing global in Payload admin.
        </p>
      </div>
    </main>
  )
}

export default CaseStudiesPage