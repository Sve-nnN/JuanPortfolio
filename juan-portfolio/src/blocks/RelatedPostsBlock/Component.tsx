import React from 'react'
import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import type { RelatedPostsBlockType, Post, Category } from '@/payload-types'
import { getRelatedPosts } from '@/utilities/getRelatedPosts'

export const RelatedPostsBlockComponent: React.FC<
  RelatedPostsBlockType & { currentPostId?: string; categories?: (string | Category)[] }
> = async (props) => {
  const { title, posts, autoSelect = true, limit = 3, currentPostId, categories } = props

  let displayPosts: Post[] = []

  // If specific posts are selected, use them
  if (posts && Array.isArray(posts) && posts.length > 0) {
    displayPosts = posts
      .filter((p): p is Post => typeof p === 'object')
      .slice(0, limit || 3)
  } else if (autoSelect && categories && categories.length > 0) {
    // Auto-select posts by category
    const categoryIds = categories
      .map((c: string | Category) => {
        if (typeof c === 'string') return c
        if (c && typeof c === 'object') return c.id
        return undefined
      })
      .filter(Boolean) as string[]

    if (categoryIds.length > 0) {
      displayPosts = await getRelatedPosts({
        currentPostId,
        categoryIds,
        limit: limit || 3
      })
    }
  }

  if (displayPosts.length === 0) return null

  return (
    <div className="mt-12">
      {title && <h3 className="text-2xl font-display font-bold mb-4">{title}</h3>}
      <RelatedPosts className="" docs={displayPosts} />
    </div>
  )
}
