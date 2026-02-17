import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Post } from '@/payload-types'
import { unstable_cache } from 'next/cache'

type Args = {
    currentPostId?: string
    categoryIds: string[]
    limit?: number
    locale?: 'en' | 'es'
}

async function fetchRelatedPosts({ currentPostId, categoryIds, limit, locale }: Args): Promise<Post[]> {
    const payload = await getPayload({ config: configPromise })

    const res = await payload.find({
        collection: 'posts',
        limit: limit || 3,
        depth: 1,
        sort: '-publishedAt',
        locale,
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
                {
                    _status: {
                        equals: 'published',
                    },
                },
            ],
        },
    })

    return (res.docs as Post[]) || []
}

export const getRelatedPosts = (args: Args) => 
    unstable_cache(
        () => fetchRelatedPosts(args), 
        ['related-posts', args.currentPostId || 'none', (args.categoryIds || []).join(','), args.locale || 'es'], 
        {
            tags: ['posts'],
            revalidate: 3600,
        }
    )()
