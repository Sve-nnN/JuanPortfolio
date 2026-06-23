import React from 'react'
import Image from 'next/image'
import type { Post } from '@/payload-types'
import { getFallbackBySlug } from '@/constants/fallbackImages'

const BlogList = async () => {
  let posts: Post[] = []
  try {
    const configPromise = (await import('@payload-config')).default
    const { getPayload } = await import('payload')

    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'posts',
      limit: 3,
      pagination: false,
      sort: '-publishedAt',
    })
    posts = (res.docs as Post[]) || []
  } catch (_err) {
    posts = [
      {
        id: 'mock-post-1',
        title: 'Artículo de ejemplo',
        meta: { description: 'Resumen del artículo de ejemplo para entorno local.' },
        publishedAt: new Date().toISOString(),
        slug: 'articulo-ejemplo',
      } as unknown as Post,
    ]
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {posts.map((p) => (
        <div
          key={p.id}
          className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group"
        >
          <a href={`/blog/${p.slug}`}>
            <div className="relative w-full h-48">
              <Image
                src={
                  p.content?.heroImage &&
                  typeof p.content.heroImage === 'object' &&
                  p.content.heroImage.url
                    ? p.content.heroImage.url
                    // No hero set: deterministic Cloudinary fallback by slug.
                    // SEO audit jun-2026, issue #44.
                    : getFallbackBySlug(p.slug ?? '')
                }
                alt={
                  (p.content?.heroImage &&
                    typeof p.content.heroImage === 'object' &&
                    p.content.heroImage.alt) ||
                  p.title ||
                  ''
                }
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <p className="text-sm text-muted mb-2">
                {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : ''}
              </p>
              <h3 className="text-lg font-bold text-current mb-2 group-hover:text-primary transition-colors">
                {p.title}
              </h3>
              <p className="text-muted text-sm">{p.meta?.description || ''}</p>
            </div>
          </a>
        </div>
      ))}
    </div>
  )
}

export default BlogList
