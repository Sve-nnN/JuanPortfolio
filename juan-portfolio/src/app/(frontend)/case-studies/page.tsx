import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

type CategoryRef = { id?: string; title?: string; label?: string }
type CardCase = {
  id: string
  title?: string | null
  slug?: string | null
  meta?: { description?: string | null } | null
  publishedAt?: string | null
  heroImage?: { url?: string; alt?: string } | null
  categories?: (CategoryRef | string)[] | null
}

const ITEMS_PER_PAGE = 12

const getItems = async (page = 1) => {
  try {
    const configPromise = (await import('@payload-config')).default
    const { getPayload } = await import('payload')
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'case-studies',
      limit: ITEMS_PER_PAGE,
      page,
      depth: 1,
      sort: '-publishedAt',
    })
    return res
  } catch (_err) {
    return {
      docs: [
        {
          id: 'mock-case-1',
          title: 'Caso de estudio de ejemplo',
          meta: { description: 'Resumen del caso de estudio para entorno local.' },
          publishedAt: new Date().toISOString(),
        },
      ],
      totalDocs: 1,
      page: 1,
      totalPages: 1,
    }
  }
}

const getCategories = async (): Promise<CategoryRef[]> => {
  try {
    const configPromise = (await import('@payload-config')).default
    const { getPayload } = await import('payload')
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({ collection: 'categories', limit: 100, pagination: false })
    return res.docs || []
  } catch (_err) {
    return []
  }
}

const CaseStudiesPage = async () => {
  const page = 1
  const posts = (await getItems(page)) as unknown as {
    docs: CardCase[]
    totalDocs: number
    page: number
    totalPages: number
  }
  const categories = await getCategories()

  return (
    <main>
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <nav aria-label="Breadcrumb" className="text-sm font-medium text-muted">
              <ol className="list-none p-0 inline-flex">
                <li className="flex items-center">
                  <Link className="hover:text-primary" href="/">
                    Inicio
                  </Link>
                  <span className="text-base mx-2">/</span>
                </li>
                <li className="flex items-center">
                  <span className="text-current">Casos de estudio</span>
                </li>
              </ol>
            </nav>
          </div>

          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-current mb-4">
              Casos de estudio
            </h1>
            <p className="max-w-3xl mx-auto text-lg text-muted">
              Proyectos, procesos y aprendizajes en los que he trabajado.
            </p>
          </div>

          <div className="mb-12 flex flex-wrap justify-center gap-2">
            <button className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-full">
              Todo
            </button>
            {categories.map((c) => (
              <button
                key={c.id || c.title || String(c)}
                className="px-4 py-2 text-sm font-medium text-muted bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {c.title || c.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.docs.map((p: CardCase) => (
              <article
                key={p.id}
                className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group flex flex-col"
              >
                <Link
                  className="block aspect-[4/3] overflow-hidden"
                  href={`/case-studies/${p.slug || p.id}`}
                >
                  {p.heroImage && typeof p.heroImage === 'object' && p.heroImage.url ? (
                    <Image
                      src={p.heroImage.url}
                      alt={p.heroImage.alt || p.title || ''}
                      width={1200}
                      height={800}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="bg-gray-100 dark:bg-card-dark w-full h-full"
                      style={{ minHeight: 200 }}
                    />
                  )}
                </Link>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="mb-3">
                    {(p.categories as (CategoryRef | string)[] | undefined)?.map((c) => {
                      const cat = typeof c === 'string' ? { id: c, label: c } : (c as CategoryRef)
                      return (
                        <span
                          key={cat.id || cat.label}
                          className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full dark:bg-blue-200 dark:text-blue-800"
                        >
                          {cat.label}
                        </span>
                      )
                    })}
                  </div>
                  <h2 className="text-xl font-bold font-display text-current mb-3 flex-grow">
                    <Link
                      className="hover:text-primary transition-colors"
                      href={`/case-studies/${p.slug || p.id}`}
                    >
                      {p.title}
                    </Link>
                  </h2>
                  <p className="text-sm text-muted mb-4">
                    {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : ''}
                  </p>
                  <p className="text-muted text-base leading-relaxed mb-4">{p.meta?.description}</p>
                  <Link
                    className="font-semibold text-primary mt-auto inline-flex items-center group-hover:underline"
                    href={`/case-studies/${p.slug || p.id}`}
                  >
                    Leer más
                    <span className="ml-1">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            {posts.totalPages > 1 && posts.page && (
              <nav aria-label="Paginación de casos de estudio">
                <ul className="inline-flex items-center -space-x-px">
                  <li>
                    <Link
                      className="py-2 px-3 ml-0 leading-tight text-muted bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                      href={`/case-studies/page/${Math.max(1, posts.page - 1)}`}
                    >
                      Anterior
                    </Link>
                  </li>

                  {Array.from({ length: posts.totalPages }).map((_, i) => (
                    <li key={i}>
                      <Link
                        aria-current={posts.page === i + 1 ? 'page' : undefined}
                        className={`py-2 px-3 leading-tight ${posts.page === i + 1 ? 'text-blue-600 bg-blue-50' : 'text-muted bg-white'} border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white`}
                        href={`/case-studies/page/${i + 1}`}
                      >
                        {i + 1}
                      </Link>
                    </li>
                  ))}

                  <li>
                    <Link
                      className="py-2 px-3 leading-tight text-muted bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                      href={`/case-studies/page/${Math.min(posts.totalPages, posts.page + 1)}`}
                    >
                      Siguiente
                    </Link>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default CaseStudiesPage
