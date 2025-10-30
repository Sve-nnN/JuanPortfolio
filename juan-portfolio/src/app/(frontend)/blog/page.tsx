/**
 * @file Defines the main blog listing page.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import React from 'react'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { getCachedGlobal } from '@/utilities/getGlobals'

/**
 * The main blog listing page component.
 * It fetches the 'blog-listing' global from the CMS and renders its blocks.
 * If no blocks are configured, it displays a fallback message.
 * @returns {Promise<React.ReactElement>} A promise that resolves to the blog page component.
 */
const BlogPage = async () => {
  // Get blog listing global with blocks
  const blogGlobal = await getCachedGlobal('blog-listing')().catch(() => null)

  // If global has layout blocks, render them
  if (
    blogGlobal &&
    'layout' in blogGlobal &&
    Array.isArray(blogGlobal.layout) &&
    blogGlobal.layout.length > 0
  ) {
    return (
      <main>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <RenderBlocks blocks={blogGlobal.layout as any} />
      </main>
    )
  }

  // Fallback UI if no blocks configured
  const title = blogGlobal && 'title' in blogGlobal ? blogGlobal.title : 'Blog'
  return (
    <main className="py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">{title}</h1>
        <p className="text-center text-muted">
          Please configure blocks in the Blog Listing global in Payload admin.
        </p>
      </div>
    </main>
  )
}

export default BlogPage