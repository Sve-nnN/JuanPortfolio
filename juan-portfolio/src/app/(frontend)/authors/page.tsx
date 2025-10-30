/**
 * @file Defines the authors listing page.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

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

/**
 * The authors listing page component.
 * @returns {Promise<React.ReactElement>} A promise that resolves to the authors page component.
 */
const AuthorsPage = async () => {
  const authors = (await getAuthors()) as AuthorRef[]

  return (
    <main>
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-current mb-4">
              Autores
            </h1>
            <p className="max-w-3xl mx-auto text-lg text-muted">
              Conoce a las personas que escriben en el blog.
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
                  href={`/author/${a.slug || a.id}`}
                >
                  Ver perfil
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