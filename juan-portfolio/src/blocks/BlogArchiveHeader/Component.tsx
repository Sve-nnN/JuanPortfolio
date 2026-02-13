import React from 'react'
import type { BlogArchiveHeaderBlock, Category, Media as MediaType } from '@/payload-types'
import Link from 'next/link'
import { getFallbackBySlug } from '@/constants/fallbackImages'
import { getCategories } from '@/utilities/getCategories'

export const BlogArchiveHeader: React.FC<BlogArchiveHeaderBlock & { locale?: 'en' | 'es' }> = async (props) => {
  const { title, description, showCategoryFilters, categories: selectedCategories, alignment = 'end', heroImage, locale = 'es' } = props

  let categoriesList: Category[] = []

  if (selectedCategories && Array.isArray(selectedCategories) && selectedCategories.length > 0) {
    categoriesList = selectedCategories
      .map((cat) => (typeof cat === 'object' ? cat : null))
      .filter((cat): cat is Category => Boolean(cat))
  } else {
    // Fetch all categories if none selected
    categoriesList = await getCategories()
  }

  const fallbackImage = getFallbackBySlug('blog-archive')

  // Resolve alignment classes
  const alignClass =
    alignment === 'start'
      ? 'items-start text-left'
      : alignment === 'center'
        ? 'items-center text-center'
        : 'items-end text-right'

  const justifyClass =
    alignment === 'start'
      ? 'justify-start'
      : alignment === 'center'
        ? 'justify-center'
        : 'justify-end'

  const localePrefix = locale === 'es' ? '' : '/en'

  return (
    <section className="relative min-h-[60vh] flex items-end justify-end pb-12 sm:pb-16 lg:pb-20">

      {/* Background & Overlay */}
      <div className="absolute inset-0 z-0 select-none">
        {heroImage && typeof heroImage === 'object' && 'url' in heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={(heroImage as MediaType).url as string}
            alt={(heroImage as MediaType).alt as string || 'Hero Background'}
            className="object-cover w-full h-full"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fallbackImage}
            alt="Hero Background"
            className="object-cover w-full h-full"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/60" />
      </div>

      <div className={`container z-10 relative flex flex-col ${alignClass} text-white`}>
        <div className={`max-w-4xl w-full flex flex-col ${alignClass} gap-6 animate-fade-in-up`}>

          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className={`flex flex-wrap gap-2 items-center mb-0 text-sm font-medium uppercase tracking-wide text-white/80 ${justifyClass}`}
          >
            <Link className="hover:text-white transition-colors" href={`${localePrefix}/`}>
              {locale === 'es' ? 'Inicio' : 'Home'}
            </Link>
            <span className="text-white/40">/</span>
            <span className="text-primary-foreground bg-primary/20 px-2 py-0.5 rounded text-xs backdrop-blur-md border border-primary/20">
              Blog
            </span>
          </nav>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white drop-shadow-sm leading-tight">
            {title}
          </h1>

          {description && (
            <p className="text-lg md:text-xl text-gray-200 leading-relaxed max-w-2xl drop-shadow-sm">
              {description}
            </p>
          )}

          {/* Category Filters as Links */}
          {showCategoryFilters && (
            <div className={`flex flex-wrap gap-2 mt-4 ${justifyClass}`}>
              <Link
                href={`${localePrefix}/blog`}
                className="px-4 py-1.5 text-sm font-medium rounded transition-colors backdrop-blur-md border bg-primary/80 border-primary text-white"
              >
                {locale === 'es' ? 'Todo' : 'All'}
              </Link>
              {categoriesList.map((category) => (
                <Link
                  key={category.id}
                  href={`${localePrefix}/blog/${category.slug}`}
                  className="px-4 py-1.5 text-sm font-medium rounded transition-colors backdrop-blur-md border bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  {category.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
