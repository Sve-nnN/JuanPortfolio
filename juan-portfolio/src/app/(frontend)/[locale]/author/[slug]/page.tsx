/**
 * @file Defines the author page.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import { Metadata } from 'next'
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

/**
 * @typedef {object} Props
 * @property {Promise<{ slug: string, locale: string }>} params - The page parameters.
 */
type Props = {
  params: Promise<{ slug: string, locale: string }>
}

/**
 * Queries a user by their slug.
 * @param {string} slug - The user slug.
 * @param {'en' | 'es'} locale - The locale.
 * @returns {Promise<any>} A promise that resolves to the user data.
 */
const queryUserBySlug = async (slug: string, locale?: 'en' | 'es') => {
  const payload = await getPayload({ config: configPromise })
  let res = await payload.find({
    collection: 'users',
    limit: 1,
    where: { slug: { equals: slug } },
    pagination: false,
    locale,
  })
  if (!res.docs?.[0]) {
    res = await payload.find({
      collection: 'users',
      limit: 1,
      where: { id: { equals: slug } },
      pagination: false,
      locale,
    })
  }
  return res.docs?.[0] || null
}

/**
 * Queries posts by a specific author.
 * @param {string} authorId - The author's ID.
 * @param {'en' | 'es'} locale - The locale.
 * @returns {Promise<any[]>} A promise that resolves to an array of posts.
 */
const queryPostsByAuthor = async (authorId: string, locale?: 'en' | 'es') => {
  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({
    collection: 'posts',
    limit: 50,
    where: {
      authors: { contains: authorId },
    },
    sort: '-publishedAt',
    locale,
  })
  return res.docs || []
}

/**
 * Generates metadata for the author page.
 * @param {object} props - The component props.
 * @param {Promise<{ slug: string, locale: string }>} props.params - The page parameters.
 * @returns {Promise<Metadata>} A promise that resolves to the page metadata.
 */
export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string, locale: string }>
}): Promise<Metadata> {
  const { slug, locale: rawLocale } = await paramsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'
  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({
    collection: 'users',
    limit: 1,
    where: { slug: { equals: slug } },
    depth: 2,
    locale,
  })
  const user = res.docs[0]
  return {
    title: user?.meta?.title || user?.name || (locale === 'es' ? 'Autor' : 'Author'),
    description: user?.meta?.description || user?.bio || '',
  }
}

/**
 * The author page component.
 * @param {Props} props - The component props.
 * @returns {Promise<React.ReactElement>} A promise that resolves to the author page component.
 */
export default async function AuthorPage({ params: paramsPromise }: Props) {
  const { slug = '', locale: rawLocale } = await paramsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'
  const localePrefix = locale === 'es' ? '' : '/en'

  if (!slug) return <p>{locale === 'es' ? 'Autor no encontrado' : 'Author not found'}</p>
  const user = await queryUserBySlug(slug, locale)
  if (!user) return <p>{locale === 'es' ? 'Autor no encontrado' : 'Author not found'}</p>

  const posts = await queryPostsByAuthor(user.id, locale)

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
                <h3 className="text-2xl font-semibold mb-3">{locale === 'es' ? 'Experiencia' : 'Experience'}</h3>
                <ul className="space-y-4">
                  {user.experience.map((e, i) => (
                    <li key={i}>
                      <div className="font-semibold">
                        {e.role} — {e.company}
                      </div>
                      <div className="text-sm text-muted">
                        {e.startDate ? new Date(e.startDate).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US') : ''} —{' '}
                        {e.endDate ? new Date(e.endDate).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US') : (locale === 'es' ? 'Presente' : 'Present')}
                      </div>
                      {e.description ? <div className="mt-1">{e.description}</div> : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8">
              <h3 className="text-2xl font-semibold mb-4">
                {locale === 'es' ? `Posts por ${user.name}` : `Posts by ${user.name}`}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {posts.map((post) => {
                  const categories = post.categories || []
                  const cat =
                    Array.isArray(categories) && categories.length > 0
                      ? typeof categories[0] === 'string'
                        ? categories[0]
                        : (categories[0] as { slug?: string | null })?.slug
                      : null
                  const postUrl = cat ? `${localePrefix}/blog/${cat}/${post.slug}` : `${localePrefix}/blog/${post.slug}`
                  return (
                    <article key={post.id} className="bg-card rounded-lg p-4">
                      <h4 className="font-semibold mb-1">
                        <Link href={postUrl}>{post.title}</Link>
                      </h4>
                      <p className="text-sm text-muted">
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US') : ''}
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