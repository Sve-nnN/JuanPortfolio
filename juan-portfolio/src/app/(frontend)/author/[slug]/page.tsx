import { Metadata } from 'next'
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

type Props = {
  params: Promise<{ slug: string }>
}

const queryUserBySlug = async (slug: string) => {
  const payload = await getPayload({ config: configPromise })
  let res = await payload.find({
    collection: 'users',
    limit: 1,
    where: { slug: { equals: slug } },
    pagination: false,
  })
  if (!res.docs?.[0]) {
    res = await payload.find({
      collection: 'users',
      limit: 1,
      where: { id: { equals: slug } },
      pagination: false,
    })
  }
  return res.docs?.[0] || null
}

const queryPostsByAuthor = async (authorId: string) => {
  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({
    collection: 'posts',
    limit: 50,
    where: {
      authors: { contains: authorId },
    },
    sort: '-publishedAt',
  })
  return res.docs || []
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({
    collection: 'users',
    limit: 1,
    where: { slug: { equals: slug } },
    depth: 2,
  })
  const user = res.docs[0]
  return {
    title: user?.meta?.title || user?.name || 'Autor',
    description: user?.meta?.description || user?.bio || '',
  }
}

export default async function AuthorPage({ params }: Props) {
  const { slug = '' } = await params
  if (!slug) return <p>Autor no encontrado</p>
  const user = await queryUserBySlug(slug)
  if (!user) return <p>Autor no encontrado</p>

  const posts = await queryPostsByAuthor(user.id)

  return (
    <main>
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {user.avatar &&
            typeof user.avatar === 'object' &&
            'url' in user.avatar &&
            user.avatar.url ? (
              <div className="w-36 h-36 rounded-full overflow-hidden mx-auto mb-4">
                <Image
                  src={user.avatar.url as string}
                  alt={user.avatar.alt || user.name || ''}
                  width={144}
                  height={144}
                  className="object-cover"
                />
              </div>
            ) : null}
            <h1 className="text-3xl font-display font-bold mb-2">{user.name}</h1>
            {user.role ? <p className="text-muted mb-4">{user.role}</p> : null}
            {user.bio ? <p className="text-lg text-muted mb-6">{user.bio}</p> : null}

            {user.experience && user.experience.length > 0 && (
              <div className="mb-8 text-left">
                <h3 className="text-2xl font-semibold mb-3">Experiencia</h3>
                <ul className="space-y-4">
                  {user.experience.map((e, i) => (
                    <li key={i}>
                      <div className="font-semibold">
                        {e.role} — {e.company}
                      </div>
                      <div className="text-sm text-muted">
                        {e.startDate ? new Date(e.startDate).toLocaleDateString() : ''} —{' '}
                        {e.endDate ? new Date(e.endDate).toLocaleDateString() : 'Presente'}
                      </div>
                      {e.description ? <div className="mt-1">{e.description}</div> : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8">
              <h3 className="text-2xl font-semibold mb-4">Posts por {user.name}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {posts.map((post) => {
                  const categories = post.meta_extras?.categories || []
                  const cat =
                    Array.isArray(categories) && categories.length > 0
                      ? typeof categories[0] === 'string'
                        ? categories[0]
                        : (categories[0] as { slug?: string | null })?.slug
                      : null
                  const postUrl = cat ? `/blog/${cat}/${post.slug}` : `/blog/${post.slug}`
                  return (
                    <article key={post.id} className="bg-card rounded-lg p-4">
                      <h4 className="font-semibold mb-1">
                        <Link href={postUrl}>{post.title}</Link>
                      </h4>
                      <p className="text-sm text-muted">
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}
                      </p>
                    </article>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
