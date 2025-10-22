import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

type Params = { params: { slug?: string } }

const queryUserBySlug = async (slug: string) => {
  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({
    collection: 'users',
    limit: 1,
    where: {
      or: [{ slug: { equals: slug } }, { id: { equals: slug } }],
    },
    pagination: false,
  })
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

export default async function AuthorPage({ params }: Params) {
  const slug = params.slug || ''
  const user = await queryUserBySlug(slug)
  if (!user) return <p>Autor no encontrado</p>

  const userData = user as unknown as Record<string, any>
  const posts = (await queryPostsByAuthor(userData.id)) as Array<Record<string, any>>

  return (
    <main>
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {user.avatar && user.avatar.url ? (
              <div className="w-36 h-36 rounded-full overflow-hidden mx-auto mb-4">
                <Image
                  src={user.avatar.url}
                  alt={user.avatar?.alt || user.name || ''}
                  width={144}
                  height={144}
                  className="object-cover"
                />
              </div>
            ) : null}
            <h1 className="text-3xl font-display font-bold mb-2">{user.name}</h1>
            {user.role ? <p className="text-muted mb-4">{user.role}</p> : null}
            {user.bio ? <p className="text-lg text-muted mb-6">{user.bio}</p> : null}

            {userData.experience && userData.experience.length > 0 && (
              <div className="mb-8 text-left">
                <h3 className="text-2xl font-semibold mb-3">Experiencia</h3>
                <ul className="space-y-4">
                  {(userData.experience as Array<Record<string, any>>).map((e, i) => (
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
                {posts.map((p: any) => (
                  <article key={p.id} className="bg-card rounded-lg p-4">
                    <h4 className="font-semibold mb-1">
                      <Link href={`/blog/${p.slug || p.id}`}>{p.title}</Link>
                    </h4>
                    <p className="text-sm text-muted">
                      {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : ''}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
