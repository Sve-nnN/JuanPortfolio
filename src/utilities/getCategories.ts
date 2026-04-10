import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Category } from '@/payload-types'
import { unstable_cache } from 'next/cache'

async function fetchCategories(locale?: 'en' | 'es'): Promise<Category[]> {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
        collection: 'categories',
        limit: 100,
        pagination: false,
        sort: 'title',
        locale,
    })
    return docs as Category[]
}

export const getCategories = (locale?: 'en' | 'es') => 
    unstable_cache(() => fetchCategories(locale), ['categories-list', locale || 'es'], {
        tags: ['categories'],
        revalidate: 3600,
    })()
