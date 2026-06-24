import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import type { Metadata } from 'next'
import { FileText, BookOpen, Briefcase, Calendar } from 'lucide-react'
import { getPostUrl } from '@/utilities/getPostUrl'
import { Header } from '@/Header/Component'
import { Footer } from '@/Footer/Component'

type Args = {
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale } = await paramsPromise
  return {
    title: locale === 'es' ? 'Mapa del Sitio | Juan Carlos Angulo' : 'Sitemap | Juan Carlos Angulo',
    description: locale === 'es'
      ? 'Mapa completo del sitio con enlaces a todas las páginas, artículos del blog y casos de estudio.'
      : 'Full site map with links to all pages, blog articles and case studies.',
    robots: {
      index: true,
      follow: true,
    },
  }
}

// Revalidate every hour (matches XML sitemap caching)
export const revalidate = 3600

export default async function SitemapPage({ params: paramsPromise }: Args) {
  const { locale: rawLocale } = await paramsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'
  const payload = await getPayload({ config })

  // Fetch everything in parallel. These ran sequentially before, which pushed
  // the page's prerender past Vercel's 60s static-generation timeout and broke
  // the production build. Promise.all collapses the wall-clock to the slowest
  // single query. SEO/CWV milestone v1.1.
  const [pages, posts, caseStudies, categories, authors] = await Promise.all([
    // Published pages
    payload.find({
      collection: 'pages',
      where: { _status: { equals: 'published' } },
      limit: 1000,
      sort: 'title',
      locale,
    }),
    // Published posts (depth 1 to include categories)
    payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      limit: 1000,
      depth: 1,
      sort: '-publishedAt',
      locale,
    }),
    // Published case studies
    payload.find({
      collection: 'case-studies',
      where: { _status: { equals: 'published' } },
      limit: 1000,
      sort: '-publishedAt',
      locale,
    }),
    // Categories
    payload.find({
      collection: 'categories',
      limit: 1000,
      sort: 'title',
      locale,
    }),
    // Authors (Users)
    payload.find({
      collection: 'users',
      limit: 1000,
      sort: 'name',
    }),
  ])

  const localePrefix = locale === 'es' ? '' : '/en'

  // Group posts by category
  const postsByCategory = posts.docs.reduce(
    (acc, post) => {
      const categories = Array.isArray(post.categories) ? post.categories : []
      if (categories.length === 0) {
        const noCatLabel = locale === 'es' ? 'Sin categoría' : 'Uncategorized'
        if (!acc[noCatLabel]) {
          acc[noCatLabel] = []
        }
        acc[noCatLabel].push(post)
      } else {
        categories.forEach((cat) => {
          const categoryName = typeof cat === 'object' && cat !== null ? cat.title : (locale === 'es' ? 'Sin categoría' : 'Uncategorized')
          if (!acc[categoryName]) {
            acc[categoryName] = []
          }
          acc[categoryName].push(post)
        })
      }
      return acc
    },
    {} as Record<string, typeof posts.docs>,
  )

  const lastUpdated = new Date().toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      <Header locale={locale} />
      <div className="min-h-screen bg-background">
      <div className="container py-16 md:py-24">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            {locale === 'es' ? 'Mapa del Sitio' : 'Sitemap'}
            <span className="block w-24 h-1 bg-blue-500 mt-4 rounded-full"></span>
          </h1>
          <p className="text-lg text-muted-foreground">
            {locale === 'es' 
              ? 'Navegación completa del sitio web con enlaces a todas las páginas, artículos y casos de estudio.'
              : 'Full website navigation with links to all pages, articles, and case studies.'}
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="w-4 h-4" />
            <span>{locale === 'es' ? 'Última actualización' : 'Last updated'}: {lastUpdated}</span>
          </div>
        </div>

        {/* Content Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {/* Pages Section */}
          <nav aria-label={locale === 'es' ? 'Páginas principales' : 'Main pages'} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground">{locale === 'es' ? 'Páginas' : 'Pages'}</h2>
            </div>
            <ul className="space-y-3">
              {pages.docs.map((page) => (
                <li key={page.id}>
                  <Link
                    href={page.slug === 'home' ? (localePrefix || '/') : `${localePrefix}/${page.slug}`}
                    className="group flex items-start gap-2 text-slate-300 hover:text-blue-400 transition-colors"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-blue-400 transition-colors flex-shrink-0"></span>
                    <span className="group-hover:underline underline-offset-2">{page.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="pt-2 text-xs text-slate-500">
              {pages.docs.length} {locale === 'es' ? 'página(s)' : 'page(s)'}
            </div>
          </nav>

          {/* Case Studies Section */}
          <nav aria-label={locale === 'es' ? 'Casos de estudio' : 'Case studies'} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Briefcase className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground">{locale === 'es' ? 'Casos de Estudio' : 'Case Studies'}</h2>
            </div>
            <ul className="space-y-3">
              {caseStudies.docs.map((caseStudy) => (
                <li key={caseStudy.id}>
                  <Link
                    href={`${localePrefix}/case-studies/${caseStudy.slug}`}
                    className="group flex items-start gap-2 text-slate-300 hover:text-blue-400 transition-colors"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-blue-400 transition-colors flex-shrink-0"></span>
                    <span className="group-hover:underline underline-offset-2">
                      {caseStudy.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="pt-2 text-xs text-slate-500">
              {caseStudies.docs.length} {locale === 'es' ? 'caso(s) de estudio' : 'case study(ies)'}
            </div>
          </nav>

          {/* Categories Section */}
          <nav aria-label={locale === 'es' ? 'Categorías' : 'Categories'} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground">{locale === 'es' ? 'Categorías' : 'Categories'}</h2>
            </div>
            <ul className="space-y-3">
              {categories.docs.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`${localePrefix}/blog/${cat.slug}`}
                    className="group flex items-start gap-2 text-slate-300 hover:text-blue-400 transition-colors"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-blue-400 transition-colors flex-shrink-0"></span>
                    <span className="group-hover:underline underline-offset-2">{cat.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Authors Section */}
          <nav aria-label={locale === 'es' ? 'Autores' : 'Authors'} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground">{locale === 'es' ? 'Autores' : 'Authors'}</h2>
            </div>
            <ul className="space-y-3">
              {authors.docs.map((author) => (
                <li key={author.id}>
                  <Link
                    href={`${localePrefix}/authors/${author.slug}`}
                    className="group flex items-start gap-2 text-slate-300 hover:text-blue-400 transition-colors"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-blue-400 transition-colors flex-shrink-0"></span>
                    <span className="group-hover:underline underline-offset-2">{author.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Blog Posts Section - Spans full width on small screens */}
          <nav
            aria-label={locale === 'es' ? 'Artículos del blog' : 'Blog articles'}
            className="space-y-8 md:col-span-2 lg:col-span-3 border-t border-slate-800 pt-12"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground">Blog</h2>
              <span className="text-sm text-slate-500">({posts.docs.length} {locale === 'es' ? 'artículos' : 'articles'})</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.entries(postsByCategory)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([categoryName, categoryPosts]) => (
                  <div key={categoryName} className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      {categoryName}
                      <span className="text-xs text-slate-500 font-normal">
                        ({categoryPosts.length})
                      </span>
                    </h3>
                    <ul className="space-y-2.5">
                      {categoryPosts.map((post) => (
                        <li key={post.id}>
                          <Link
                            href={`${localePrefix}${getPostUrl(post)}`}
                            className="group flex items-start gap-2 text-sm text-slate-300 hover:text-blue-400 transition-colors"
                          >
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-600 group-hover:bg-blue-400 transition-colors flex-shrink-0"></span>
                            <span className="group-hover:underline underline-offset-2 line-clamp-2">
                              {post.title}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </nav>
        </div>

        {/* Footer Note */}
        <div className="max-w-4xl mx-auto mt-16 pt-8 border-t border-slate-800">
          <p className="text-sm text-slate-500 text-center">
            {locale === 'es' ? '¿Buscas el sitemap para motores de búsqueda?' : 'Looking for the search engine sitemap?'}
            {' '}
            <Link
              href="/sitemap.xml"
              className="text-blue-400 hover:text-blue-300 hover:underline underline-offset-2"
            >
              {locale === 'es' ? 'Ver sitemap XML' : 'View XML sitemap'}
            </Link>
          </p>
        </div>
      </div>
      </div>
      <Footer locale={locale} />
    </>
  )
}
