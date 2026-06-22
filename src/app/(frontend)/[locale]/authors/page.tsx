/**
 * @file Defines the authors listing page.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { generateMeta } from '@/utilities/generateMeta'

/**
 * @typedef {object} AuthorRef
 * @property {string} [id] - The author's ID.
 * @property {string} [name] - The author's name.
 * @property {string} [slug] - The author's slug.
 * @property {object} [avatar] - The author's avatar.
 * @property {string} [avatar.url] - The URL of the avatar image.
 * @property {string} [avatar.alt] - The alt text for the avatar image.
 * @property {string} [role] - The author's role.
 */
type AuthorRef = {
  id?: string
  name?: string
  slug?: string
  avatar?: { url?: string; alt?: string }
  role?: string
}

/**
 * Fetches all authors from the CMS.
 * @returns {Promise<AuthorRef[]>} A promise that resolves to an array of authors.
 */
const getAuthors = async () => {
  try {
    const configPromise = (await import('@payload-config')).default
    const { getPayload } = await import('payload')
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({ collection: 'users', limit: 100, pagination: false })
    return res.docs || []
  } catch {
    return []
  }
}

type Args = {
  params: Promise<{
    locale: string
  }>
}

/**
 * Self-referential metadata for the authors listing. Without it the page
 * inherited the root layout's homepage canonical (cross-canonical to /),
 * which Google flagged ("chose /authors instead of user-declared /").
 * SEO audit jun-2026, issue #14.
 */
export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale: rawLocale } = await paramsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'
  const title = locale === 'es' ? 'Autores | Juan Tech' : 'Authors | Juan Tech'
  const description =
    locale === 'es'
      ? 'Conoce a las personas que escriben en el blog de Juan Tech sobre SEO técnico, desarrollo web con Next.js y automatización de contenido.'
      : 'Meet the people who write on the Juan Tech blog about technical SEO, Next.js web development and content automation.'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return generateMeta({ doc: { title, meta: { description } } as any, locale, path: '/authors' })
}

/**
 * The authors listing page component.
 * @returns {Promise<React.ReactElement>} A promise that resolves to the authors page component.
 */
const AuthorsPage = async ({ params: paramsPromise }: Args) => {
  const { locale: rawLocale } = await paramsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'
  const authors = (await getAuthors()) as AuthorRef[]
  const localePrefix = locale === 'es' ? '' : '/en'

  return (
    <main>
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-current mb-4">
              {locale === 'es' ? 'Autores' : 'Authors'}
            </h1>
            <p className="max-w-3xl mx-auto text-lg text-muted">
              {locale === 'es' 
                ? 'Conoce a las personas que escriben en el blog.' 
                : 'Meet the people who write on the blog.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {authors.map((a) => (
              <article
                key={a.id}
                className="bg-card rounded-lg overflow-hidden shadow-lg p-6 flex flex-col items-center text-center"
              >
                {a.avatar && a.avatar.url ? (
                  <div className="w-32 h-32 rounded-full overflow-hidden mb-4">
                    <Image
                      src={a.avatar.url}
                      alt={a.avatar?.alt || a.name || ''}
                      width={128}
                      height={128}
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <h3 className="text-xl font-bold mb-1">{a.name}</h3>
                {a.role ? <p className="text-sm text-muted mb-3">{a.role}</p> : null}
                <Link
                  className="text-primary font-semibold mt-auto"
                  href={`${localePrefix}/author/${a.slug || a.id}`}
                >
                  {locale === 'es' ? 'Ver perfil' : 'View profile'}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default AuthorsPage