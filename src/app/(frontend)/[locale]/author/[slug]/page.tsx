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
import { JsonLd } from '@/components/JsonLd'
import { generatePersonSchema } from '@/utilities/schema'
import { getServerSideURL } from '@/utilities/getURL'
import { User } from '@/payload-types'

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
type ResolvedAuthorSource = 'authors' | 'users'

// Resolve an author by slug: prefer the `authors` collection, fall back to `users`
// (by slug, then id) when there is no Author match. Single-deploy safe regardless
// of whether the migration has run. Phase 56 (AUTHORS-03). The resolved Author doc
// is cast to `User` for render — `Authors` replicates the same fields verbatim.
const queryUserBySlug = async (
  slug: string,
  locale?: 'en' | 'es',
): Promise<{ doc: User; source: ResolvedAuthorSource } | null> => {
  const payload = await getPayload({ config: configPromise })
  try {
    let fromAuthors = await payload.find({
      collection: 'authors',
      limit: 1,
      where: { slug: { equals: slug } },
      pagination: false,
      locale,
      depth: 2,
    })
    if (!fromAuthors.docs?.[0]) {
      fromAuthors = await payload.find({
        collection: 'authors',
        limit: 1,
        where: { id: { equals: slug } },
        pagination: false,
        locale,
        depth: 2,
      })
    }
    if (fromAuthors.docs?.[0]) {
      return { doc: fromAuthors.docs[0] as unknown as User, source: 'authors' }
    }
  } catch (error) {
    console.error('queryAuthorBySlug (authors) failed:', error)
  }

  let res = await payload.find({
    collection: 'users',
    limit: 1,
    where: { slug: { equals: slug } },
    pagination: false,
    locale,
    depth: 2,
  })
  if (!res.docs?.[0]) {
    res = await payload.find({
      collection: 'users',
      limit: 1,
      where: { id: { equals: slug } },
      pagination: false,
      locale,
      depth: 2,
    })
  }
  return res.docs?.[0] ? { doc: res.docs[0] as User, source: 'users' } : null
}

/**
 * Queries posts by a specific author, matching on the resolved source.
 * @param {string} authorId - The author's ID.
 * @param {ResolvedAuthorSource} source - Whether the profile resolved from Authors or users.
 * @param {'en' | 'es'} locale - The locale.
 * @returns {Promise<any[]>} A promise that resolves to an array of posts.
 */
const queryPostsByAuthor = async (
  authorId: string,
  source: ResolvedAuthorSource,
  locale?: 'en' | 'es',
) => {
  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({
    collection: 'posts',
    limit: 50,
    where:
      source === 'authors'
        ? { postAuthors: { contains: authorId } }
        : { authors: { contains: authorId } },
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
  const resolved = await queryUserBySlug(slug, locale)
  const user = resolved?.doc
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
  const resolved = await queryUserBySlug(slug, locale)
  if (!resolved) return <p>{locale === 'es' ? 'Autor no encontrado' : 'Author not found'}</p>
  const user = resolved.doc

  const posts = await queryPostsByAuthor(user.id, resolved.source, locale)

  const personSchema = generatePersonSchema({
    name: user.name,
    url: `${getServerSideURL()}${localePrefix}/author/${user.slug}`,
    jobTitle: user.jobTitle || undefined,
    description: user.bio || undefined,
    image: typeof user.avatar === 'object' ? user.avatar?.url || undefined : undefined,
    sameAs: [
      user.socialMedia?.linkedin,
      user.socialMedia?.github,
      user.socialMedia?.twitter,
      user.socialMedia?.website,
    ].filter((url): url is string => typeof url === 'string' && !!url),
    knowsAbout: user.expertise?.map((e) => e.topic).filter((t): t is string => !!t),
    hasCredential: user.education?.map((e) => ({
      name: e.degree,
      organization: e.institution || '',
      datePublished: e.endDate || undefined,
    })),
  })

  return (
    <main>
      <JsonLd schema={personSchema} />
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {user.avatar &&
              typeof user.avatar === 'object' &&
              'url' in user.avatar &&
              user.avatar.url ? (
              <div className="w-36 h-36 rounded-full overflow-hidden mx-auto mb-4 border-2 border-primary/20 p-1">
                <Image
                  src={user.avatar.url as string}
                  alt={user.avatar.alt || user.name || ''}
                  width={144}
                  height={144}
                  className="object-cover rounded-full"
                  // Payload media is already delivered as optimized AVIF/WebP;
                  // re-running it through the Next optimizer returns 400
                  // (INVALID_IMAGE_OPTIMIZE_REQUEST). Serve it directly. IMG-03.
                  unoptimized={/\.(avif|webp)$/i.test(user.avatar.url as string)}
                />
              </div>
            ) : null}
            <h1 className="text-4xl font-display font-bold mb-2">{user.name}</h1>
            {user.jobTitle ? (
              <p className="text-xl font-semibold text-primary mb-2 uppercase tracking-wider">
                {user.jobTitle}
              </p>
            ) : null}
            {user.role && user.role !== user.jobTitle ? (
              <p className="text-muted mb-4 italic">{user.role}</p>
            ) : null}

            <div className="flex justify-center gap-6 mb-8">
              {user.socialMedia?.linkedin && (
                <Link
                  href={user.socialMedia.linkedin}
                  target="_blank"
                  className="text-muted hover:text-primary transition-colors font-medium"
                >
                  LinkedIn
                </Link>
              )}
              {user.socialMedia?.github && (
                <Link
                  href={user.socialMedia.github}
                  target="_blank"
                  className="text-muted hover:text-primary transition-colors font-medium"
                >
                  GitHub
                </Link>
              )}
              {user.socialMedia?.twitter && (
                <Link
                  href={user.socialMedia.twitter}
                  target="_blank"
                  className="text-muted hover:text-primary transition-colors font-medium"
                >
                  Twitter/X
                </Link>
              )}
            </div>

            {user.bio ? (
              <p className="text-lg text-muted mb-10 leading-relaxed max-w-2xl mx-auto">
                {user.bio}
              </p>
            ) : null}

            {user.expertise && user.expertise.length > 0 && (
              <div className="mb-12 text-left bg-card/30 p-8 rounded-2xl border border-border shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <span className="w-3 h-3 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]"></span>
                  {locale === 'es' ? 'Habilidades Técnicas & Expertise' : 'Technical Skills & Expertise'}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {user.expertise.map((e, i) => (
                    <span
                      key={i}
                      className="px-4 py-1.5 bg-primary/5 text-primary rounded-lg text-sm font-semibold border border-primary/20"
                    >
                      {e.topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {user.education && user.education.length > 0 && (
              <div className="mb-12 text-left">
                <h3 className="text-2xl font-bold mb-8">
                  {locale === 'es' ? 'Certificaciones y Educación' : 'Certifications & Education'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {user.education.map((e, i) => (
                    <div
                      key={i}
                      className="p-5 bg-card rounded-xl border border-border hover:border-primary/50 transition-all duration-300 group hover:shadow-md"
                    >
                      <div className="flex gap-5">
                        {e.logo && typeof e.logo === 'object' && 'url' in e.logo && (
                          <div className="flex-shrink-0">
                            <Image
                              src={e.logo.url as string}
                              alt={e.institution || ''}
                              width={56}
                              height={56}
                              className="rounded-lg grayscale group-hover:grayscale-0 transition-all"
                              unoptimized={/\.(avif|webp)$/i.test(e.logo.url as string)}
                            />
                          </div>
                        )}
                        <div className="flex flex-col justify-center">
                          <div className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                            {e.degree}
                          </div>
                          <div className="text-sm font-medium text-muted/80 mt-1">
                            {e.institution}
                          </div>
                          <div className="text-xs text-muted/50 mt-2 font-mono">
                            {e.endDate
                              ? new Date(e.endDate).getFullYear()
                              : locale === 'es'
                              ? 'Presente'
                              : 'Present'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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