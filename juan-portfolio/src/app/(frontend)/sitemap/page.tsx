import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import type { Metadata } from 'next'
import { FileText, BookOpen, Briefcase, Calendar } from 'lucide-react'
import { getPostUrl } from '@/utilities/getPostUrl'

export const metadata: Metadata = {
    title: 'Mapa del Sitio | Juan Carlos Angulo',
    description:
        'Mapa completo del sitio con enlaces a todas las páginas, artículos del blog y casos de estudio.',
    robots: {
        index: true,
        follow: true,
    },
}

// Revalidate every hour (matches XML sitemap caching)
export const revalidate = 3600

export default async function SitemapPage() {
    const payload = await getPayload({ config })

    // Fetch all published pages
    const pages = await payload.find({
        collection: 'pages',
        where: {
            _status: { equals: 'published' },
        },
        limit: 1000,
        sort: 'title',
    })

    // Fetch all published posts with categories
    const posts = await payload.find({
        collection: 'posts',
        where: {
            _status: { equals: 'published' },
        },
        limit: 1000,
        depth: 1, // Include categories
        sort: '-publishedAt',
    })

    // Fetch all published case studies
    const caseStudies = await payload.find({
        collection: 'case-studies',
        where: {
            _status: { equals: 'published' },
        },
        limit: 1000,
        sort: '-publishedAt',
    })

    // Group posts by category
    const postsByCategory = posts.docs.reduce(
        (acc, post) => {
            const categories = Array.isArray(post.categories) ? post.categories : []
            if (categories.length === 0) {
                if (!acc['Sin categoría']) {
                    acc['Sin categoría'] = []
                }
                acc['Sin categoría'].push(post)
            } else {
                categories.forEach((cat) => {
                    const categoryName = typeof cat === 'object' && cat !== null ? cat.title : 'Sin categoría'
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

    const lastUpdated = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })

    return (
        <div className="min-h-screen bg-background">
            <div className="container py-16 md:py-24">
                {/* Header */}
                <div className="max-w-4xl mx-auto mb-16 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        Mapa del Sitio
                        <span className="block w-24 h-1 bg-blue-500 mt-4 rounded-full"></span>
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Navegación completa del sitio web con enlaces a todas las páginas, artículos y casos de
                        estudio.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="w-4 h-4" />
                        <span>Última actualización: {lastUpdated}</span>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {/* Pages Section */}
                    <nav aria-label="Páginas principales" className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <FileText className="w-5 h-5 text-blue-500" />
                            </div>
                            <h2 className="text-2xl font-semibold text-foreground">Páginas</h2>
                        </div>
                        <ul className="space-y-3">
                            {pages.docs
                                .map((page) => (
                                    <li key={page.id}>
                                        <Link
                                            href={page.slug === 'home' ? '/' : `/${page.slug}`}
                                            className="group flex items-start gap-2 text-slate-300 hover:text-blue-400 transition-colors"
                                        >
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-blue-400 transition-colors flex-shrink-0"></span>
                                            <span className="group-hover:underline underline-offset-2">{page.title}</span>
                                        </Link>
                                    </li>
                                ))}
                        </ul>
                        <div className="pt-2 text-xs text-slate-500">
                            {pages.docs.length} página(s)
                        </div>
                    </nav>

                    {/* Case Studies Section */}
                    <nav aria-label="Casos de estudio" className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Briefcase className="w-5 h-5 text-blue-500" />
                            </div>
                            <h2 className="text-2xl font-semibold text-foreground">Casos de Estudio</h2>
                        </div>
                        <ul className="space-y-3">
                            {caseStudies.docs
                                .map((caseStudy) => (
                                    <li key={caseStudy.id}>
                                        <Link
                                            href={`/case-studies/${caseStudy.slug}`}
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
                            {caseStudies.docs.length} caso(s) de estudio
                        </div>
                    </nav>

                    {/* Blog Posts Section - Spans full width on small screens */}
                    <nav
                        aria-label="Artículos del blog"
                        className="space-y-8 md:col-span-2 lg:col-span-3 border-t border-slate-800 pt-12"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <BookOpen className="w-5 h-5 text-blue-500" />
                            </div>
                            <h2 className="text-2xl font-semibold text-foreground">Blog</h2>
                            <span className="text-sm text-slate-500">({posts.docs.length} artículos)</span>
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
                                            {categoryPosts
                                                .map((post) => (
                                                    <li key={post.id}>
                                                        <Link
                                                            href={getPostUrl(post)}
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
                        ¿Buscas el sitemap para motores de búsqueda?{' '}
                        <Link
                            href="/sitemap.xml"
                            className="text-blue-400 hover:text-blue-300 hover:underline underline-offset-2"
                        >
                            Ver sitemap XML
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
