import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Category } from '@/payload-types'
import { unstable_cache } from 'next/cache'

async function fetchCategories(): Promise<Category[]> {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
        collection: 'categories',
        limit: 100,
        pagination: false,
        sort: 'title',
    })
    return docs as Category[]
}

export const getCategories = unstable_cache(fetchCategories, ['categories-list'], {
    tags: ['categories'],
    revalidate: 3600,
})
