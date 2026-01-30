import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Post, Category } from '@/payload-types'
import { unstable_cache } from 'next/cache'

type Args = {
    currentPostId?: string
    categoryIds: string[]
    limit?: number
}

async function fetchRelatedPosts({ currentPostId, categoryIds, limit }: Args): Promise<Post[]> {
    const payload = await getPayload({ config: configPromise })

    const res = await payload.find({
        collection: 'posts',
        limit: limit || 3,
        depth: 1,
        sort: '-publishedAt',
        where: {
            and: [
                {
                    id: {
                        not_equals: currentPostId,
                    },
                },
                {
                    or: categoryIds.map((id) => ({
                        categories: {
                            contains: id,
                        },
                    })),
                },
            ],
        },
    })

    return (res.docs as Post[]) || []
}

export const getRelatedPosts = unstable_cache(fetchRelatedPosts, ['related-posts'], {
    tags: ['posts'],
    revalidate: 3600,
})
