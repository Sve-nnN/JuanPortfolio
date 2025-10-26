import React from 'react'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { getCachedGlobal } from '@/utilities/getGlobals'

const BlogPage = async () => {
  // Get blog listing global with blocks
  let blogGlobal: any = null
  try {
    blogGlobal = await getCachedGlobal('blog-listing')()
  } catch {
    // Fallback if global not found
  }

  // If global has layout blocks, render them
  if (blogGlobal?.layout && Array.isArray(blogGlobal.layout) && blogGlobal.layout.length > 0) {
    return (
      <main>
        <RenderBlocks blocks={blogGlobal.layout} />
      </main>
    )
  }

  // Fallback UI if no blocks configured
  return (
    <main className="py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">{blogGlobal?.title || 'Blog'}</h1>
        <p className="text-center text-muted">
          Please configure blocks in the Blog Listing global in Payload admin.
        </p>
      </div>
    </main>
  )
}

export default BlogPage
