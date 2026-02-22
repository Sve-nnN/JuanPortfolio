import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const locale = (searchParams.get('locale') || 'es') as 'en' | 'es'

  if (!query) {
    return NextResponse.json({ results: [] })
  }

  const payload = await getPayload({ config: configPromise })

  try {
    const posts = await payload.find({
      collection: 'search',
      depth: 1,
      limit: 5,
      locale,
      select: {
        title: true,
        slug: true,
        categories: true,
        meta: true,
      },
      pagination: false,
      where: {
        or: [
          { title: { like: query } },
          { 'meta.description': { like: query } },
          { 'meta.title': { like: query } },
          { slug: { like: query } },
        ],
      },
    })

    return NextResponse.json({ results: posts.docs })
  } catch (error) {
    console.error('Error in autocomplete API:', error)
    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
