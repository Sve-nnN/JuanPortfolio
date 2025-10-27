'use client'

import React, { useState } from 'react'
import type { BlogArchiveHeaderBlock } from '@/payload-types'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export const BlogArchiveHeader: React.FC<BlogArchiveHeaderBlock> = (props) => {
  const { title, description, showCategoryFilters, categories } = props
  const [activeCategory, setActiveCategory] = useState<string>('all')

  // Get categories list
  const categoriesList =
    categories && Array.isArray(categories)
      ? categories.map((cat) => (typeof cat === 'object' ? cat : null)).filter(Boolean)
      : []

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <nav
            aria-label="Breadcrumb"
            className="text-sm font-medium text-gray-600 dark:text-gray-400"
          >
            <ol className="list-none p-0 inline-flex">
              <li className="flex items-center">
                <Link className="hover:text-primary" href="/">
                  Inicio
                </Link>
                <ChevronRight className="w-4 h-4 mx-2" />
              </li>
              <li className="flex items-center">
                <span className="text-current">Blog</span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Title and Description */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-current mb-4">{title}</h1>
          {description && (
            <p className="max-w-3xl mx-auto text-lg text-gray-700 dark:text-gray-300">
              {description}
            </p>
          )}
        </div>

        {/* Category Filters */}
        {showCategoryFilters && (
          <div className="mb-12 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                activeCategory === 'all'
                  ? 'text-white bg-primary'
                  : 'text-gray-600 bg-gray-200 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Todo
            </button>
            {categoriesList
              .filter((cat) => cat !== null)
              .map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    activeCategory === category.id
                      ? 'text-white bg-primary'
                      : 'text-gray-600 bg-gray-200 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {category.title}
                </button>
              ))}
          </div>
        )}
      </div>
    </section>
  )
}
