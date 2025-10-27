import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import RelatedPosts from '@/components/RelatedPosts'
import type { Post } from '@/payload-types'

interface RelatedPostsServerProps {
  currentPostId: string | number
  categoryId: string | number
}

const RelatedPostsServer = async ({ currentPostId, categoryId }: RelatedPostsServerProps) => {
  const payload = await getPayload({ config })
  const postsRes = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 10,
    sort: '-createdAt',
    where: {
      'meta_extras.categories': {
        equals: categoryId,
      },
    },
  })
  const posts = postsRes.docs as Post[]
  return <RelatedPosts currentPostId={currentPostId} categoryId={categoryId} posts={posts} />
}

export default RelatedPostsServer
