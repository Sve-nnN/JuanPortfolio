import React from 'react'
import RelatedPosts from '@/components/RelatedPosts'
import { getRelatedPosts } from '@/utilities/getRelatedPosts'

interface RelatedPostsServerProps {
  currentPostId: string | number
  categoryIds: (string | number)[]
  locale?: 'en' | 'es'
}

const RelatedPostsServer = async ({ currentPostId, categoryIds, locale }: RelatedPostsServerProps) => {
  const posts = await getRelatedPosts({
    currentPostId: String(currentPostId),
    categoryIds: categoryIds.map(id => String(id)),
    limit: 3,
    locale
  })

  return <RelatedPosts posts={posts} locale={locale} />
}

export default RelatedPostsServer
