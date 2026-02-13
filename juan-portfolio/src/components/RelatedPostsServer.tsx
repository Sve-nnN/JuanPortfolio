import React from 'react'
import RelatedPosts from '@/components/RelatedPosts'
import { getRelatedPosts } from '@/utilities/getRelatedPosts'

interface RelatedPostsServerProps {
  currentPostId: string | number
  categoryId: string | number
  locale?: 'en' | 'es'
}

const RelatedPostsServer = async ({ currentPostId, categoryId, locale }: RelatedPostsServerProps) => {
  const posts = await getRelatedPosts({
    currentPostId: String(currentPostId),
    categoryIds: [String(categoryId)],
    limit: 3,
    locale
  })

  return <RelatedPosts currentPostId={currentPostId} categoryId={categoryId} posts={posts} locale={locale} />
}

export default RelatedPostsServer
