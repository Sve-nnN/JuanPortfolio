import React from 'react'
import RelatedPosts from '@/components/RelatedPosts'
import { getRelatedPosts } from '@/utilities/getRelatedPosts'

interface RelatedPostsServerProps {
  currentPostId: string | number
  categoryId: string | number
}

const RelatedPostsServer = async ({ currentPostId, categoryId }: RelatedPostsServerProps) => {
  const posts = await getRelatedPosts({
    currentPostId: String(currentPostId),
    categoryIds: [String(categoryId)],
    limit: 3
  })

  return <RelatedPosts currentPostId={currentPostId} categoryId={categoryId} posts={posts} />
}

export default RelatedPostsServer
