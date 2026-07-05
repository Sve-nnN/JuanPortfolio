import React from 'react'
import type { BlogArchiveHeaderBlock, Category, Media as MediaType } from '@/payload-types'
import Link from 'next/link'
import Image from 'next/image'
import { Media } from '@/components/Media'
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
    categoriesList = await getCategories(locale)
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
    <section className="relative min-h-[60vh] flex items-end justify-end pt-32 pb-12 sm:pb-16 lg:pb-20 overflow-hidden">

      {/* Background & Overlay */}
      <div className="absolute inset-0 z-0 select-none">
        {heroImage && typeof heroImage === 'object' ? (
          <Media
            resource={heroImage as MediaType}
            fill
            imgClassName="object-cover"
            priority
            htmlElement={null}
          />
        ) : (
          <Image
            src={fallbackImage}
            alt="Hero Background"
            fill
            className="object-cover"
            priority
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
          <h1 className="text-display font-display font-bold text-white drop-shadow-2xl leading-[0.9] tracking-tighter">
            {title}
          </h1>

          {description && (
            <p className="text-lg md:text-xl text-gray-100 leading-tight max-w-3xl drop-shadow-lg font-medium">
              {description}
            </p>
          )}

          {/* Category Filters as Links */}
          {showCategoryFilters && (
            <div className={`flex flex-wrap gap-3 mt-8 ${justifyClass}`}>
              <Link
                href={`${localePrefix}/blog`}
                className="px-6 py-2.5 text-lg font-bold rounded-full transition-all backdrop-blur-xl border bg-primary border-primary/50 text-white shadow-xl hover:shadow-primary/20"
              >
                {locale === 'es' ? 'Todo' : 'All'}
              </Link>
              {categoriesList.map((category) => (
                <Link
                  key={category.id}
                  href={`${localePrefix}/blog/${category.slug}`}
                  className="px-6 py-2.5 text-lg font-bold rounded-full transition-all backdrop-blur-xl border bg-white/10 border-white/20 text-white hover:bg-white/20 shadow-lg"
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
