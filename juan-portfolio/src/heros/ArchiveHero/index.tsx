import React from 'react'
import Link from 'next/link'
import { Media } from '@/components/Media' // Adjust path if necessary
import type { Media as MediaType } from '@/payload-types'
import { getFallbackBySlug } from '@/constants/fallbackImages'

type ArchiveHeroProps = {
    title: string
    description?: string | null
    // Image can be a URL string (fallback) or a Media object (from Payload)
    heroImage?: MediaType | string | null
    alignment?: 'start' | 'center' | 'end'
    breadcrumbs?: { label: string; href?: string }[]
    categoryFilters?: { title: string; slug: string; id: string; isActive: boolean }[] | null
    fallbackSlug?: string
}

export const ArchiveHero: React.FC<ArchiveHeroProps> = ({
    title,
    description,
    heroImage,
    alignment = 'end', // Default to Right/End
    breadcrumbs = [],
    categoryFilters = null,
    fallbackSlug = 'blog-archive',
}) => {
    // Determine alignment classes
    const alignClass =
        alignment === 'start'
            ? 'items-start text-left'
            : alignment === 'center'
                ? 'items-center text-center'
                : 'items-end text-right'

    // Resolve Background Image
    let backgroundContent: React.ReactNode = null

    if (heroImage && typeof heroImage === 'object' && 'url' in heroImage) {
        // Payload Media Object
        backgroundContent = (
            <Media
                resource={heroImage}
                className="object-cover w-full h-full"
            />
        )
    } else if (typeof heroImage === 'string') {
        // URL string
        backgroundContent = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={heroImage}
                alt="Hero Background"
                className="object-cover w-full h-full"
            />
        )
    } else {
        // Fallback
        backgroundContent = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={getFallbackBySlug(fallbackSlug)}
                alt="Hero Background"
                className="object-cover w-full h-full"
            />
        )
    }

    return (
        <section className="relative min-h-[60vh] flex items-end pb-12 sm:pb-16 lg:pb-20 mb-8">
            {/* Background & Overlay */}
            <div className="absolute inset-0 z-0 select-none">
                {backgroundContent}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/60" />
            </div>

            <div className={`container z-10 relative flex flex-col ${alignClass} text-white`}>
                {/* Alignment Wrapper */}
                <div className={`max-w-4xl w-full flex flex-col ${alignClass} gap-3 animate-fade-in-up pt-32 md:pt-40`}>

                    {/* Breadcrumbs */}
                    {breadcrumbs && breadcrumbs.length > 0 && (
                        <nav
                            aria-label="Breadcrumb"
                            className={`flex flex-wrap gap-2 items-center mb-0 text-sm font-medium uppercase tracking-wide text-white/80 ${alignment === 'end' ? 'justify-end' : alignment === 'center' ? 'justify-center' : 'justify-start'
                                }`}
                        >
                            {breadcrumbs.map((crumb, index) => {
                                const isLast = index === breadcrumbs.length - 1
                                return (
                                    <React.Fragment key={index}>
                                        {index > 0 && <span className="text-white/40">/</span>}
                                        {isLast ? (
                                            <span className="text-primary-foreground bg-primary/20 px-2 py-0.5 rounded text-[10px] backdrop-blur-md border border-primary/20 tracking-wider">
                                                {crumb.label}
                                            </span>
                                        ) : (
                                            <Link
                                                href={crumb.href || '#'}
                                                className="hover:text-white transition-colors text-xs opacity-70"
                                            >
                                                {crumb.label}
                                            </Link>
                                        )}
                                    </React.Fragment>
                                )
                            })}
                        </nav>
                    )}

                    <h1
                        className="font-display font-bold text-white drop-shadow-md leading-[1.1] tracking-tighter"
                        style={{ fontSize: 'clamp(2.25rem, 6vw, 3.75rem)' }}
                    >
                        {title}
                    </h1>

                    {description && (
                        <p
                            className="text-gray-200 leading-relaxed max-w-2xl drop-shadow-sm"
                            style={{ fontSize: 'clamp(1.125rem, 1.5vw, 1.25rem)' }}
                        >
                            {description}
                        </p>
                    )}

                    {/* Category Filters */}
                    {categoryFilters && categoryFilters.length > 0 && (
                        <div className={`flex flex-wrap gap-2 mt-4 ${alignment === 'end' ? 'justify-end' : alignment === 'center' ? 'justify-center' : 'justify-start'
                            }`}>
                            {categoryFilters.map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/blog/${cat.slug}`}
                                    className={`px-4 py-1.5 text-sm font-medium rounded transition-colors backdrop-blur-md border ${cat.isActive
                                        ? 'bg-primary/80 border-primary text-white'
                                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                        }`}
                                >
                                    {cat.title}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
