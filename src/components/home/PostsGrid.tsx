import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Post } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

const PostsGrid = ({ posts }: { posts: Array<Partial<Post>> }) => {
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((p) => {
            const imgUrl =
              p.content?.heroImage &&
              typeof p.content.heroImage === 'object' &&
              p.content.heroImage.url
                ? getServerSideURL().replace(/\/$/, '') + p.content.heroImage.url
                : typeof p.content?.heroImage === 'string'
                  ? p.content.heroImage
                  : null
            return (
              <article key={p.id} className="bg-white border rounded overflow-hidden">
                {imgUrl ? (
                  <div className="relative w-full h-48">
                    <Image
                      src={imgUrl}
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
                ) : null}
                <div className="p-4">
                  <h3 className="text-lg font-heading mb-2">{p.title}</h3>
                  <Link href={`/blog/${p.slug}`} className="text-sm text-blue-600">
                    Leer más →
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default PostsGrid
