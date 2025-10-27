import React from 'react'
import type { PostArticleHeaderBlock } from '@/payload-types'
import { Media } from '@/components/Media'
import Link from 'next/link'
import { ChevronRight, Home, Clock, Facebook, Twitter, Linkedin, Mail } from 'lucide-react'

export const PostArticleHeader: React.FC<PostArticleHeaderBlock> = (props) => {
  const { category, title, author, publishedDate, readTime, featuredImage, showSocialShare } = props

  // Format date
  const formattedDate = publishedDate
    ? new Date(publishedDate).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  // Get category name
  const categoryName = category && typeof category === 'object' ? category.title : ''

  // Get author data
  const authorName =
    author && typeof author === 'object' && 'name' in author ? author.name : 'Juan Carlos Angulo'
  const authorImage =
    author &&
    typeof author === 'object' &&
    'avatar' in author &&
    typeof author.avatar === 'object' &&
    author.avatar
      ? author.avatar
      : null

  return (
    <article className="py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex text-sm text-gray-600 dark:text-gray-400 mb-8"
          >
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link
                  href="/"
                  className="inline-flex items-center hover:text-primary transition-colors"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="w-4 h-4" />
                  <Link href="/#blog" className="ml-1 md:ml-2 hover:text-primary transition-colors">
                    Blog
                  </Link>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <ChevronRight className="w-4 h-4" />
                  <span className="ml-1 md:ml-2 font-medium text-current">{title}</span>
                </div>
              </li>
            </ol>
          </nav>

          {/* Header */}
          <header className="text-center mb-16">
            {categoryName && (
              <div className="mb-4">
                <span className="text-primary font-semibold text-sm bg-blue-100 dark:bg-blue-900/50 py-1 px-3 rounded-full">
                  {categoryName}
                </span>
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-display font-bold text-current leading-tight mb-6">
              {title}
            </h1>

            {/* Meta info */}
            <div className="flex justify-center items-center space-x-4 text-gray-600 dark:text-gray-400 flex-wrap">
              <div className="flex items-center space-x-2">
                {authorImage && (
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <Media resource={authorImage} className="w-full h-full object-cover" />
                  </div>
                )}
                <span>{authorName}</span>
              </div>
              {formattedDate && (
                <>
                  <span className="hidden sm:inline">|</span>
                  <time dateTime={publishedDate || undefined}>{formattedDate}</time>
                </>
              )}
              {readTime && (
                <>
                  <span className="hidden sm:inline">|</span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{readTime}</span>
                  </span>
                </>
              )}
            </div>
          </header>

          {/* Featured Image */}
          {featuredImage && typeof featuredImage === 'object' && (
            <figure className="mb-16">
              <div className="w-full h-auto rounded-lg shadow-lg aspect-video overflow-hidden">
                <Media resource={featuredImage} className="w-full h-full object-cover" />
              </div>
            </figure>
          )}

          {/* Social Share */}
          {showSocialShare && (
            <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between">
              <h3 className="text-lg font-semibold text-current mb-4 sm:mb-0">
                ¡Comparte este artículo!
              </h3>
              <div className="flex items-center space-x-3">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${typeof window !== 'undefined' ? window.location.href : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                  title="Compartir en Facebook"
                >
                  <Facebook className="w-6 h-6 text-[#1877F2]" />
                  <span className="sr-only">Facebook</span>
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${typeof window !== 'undefined' ? window.location.href : ''}&text=${title}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                  title="Compartir en Twitter"
                >
                  <Twitter className="w-6 h-6 text-[#1DA1F2]" />
                  <span className="sr-only">Twitter</span>
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${typeof window !== 'undefined' ? window.location.href : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                  title="Compartir en LinkedIn"
                >
                  <Linkedin className="w-6 h-6 text-[#0A66C2]" />
                  <span className="sr-only">LinkedIn</span>
                </a>
                <a
                  href={`mailto:?subject=${title}&body=${typeof window !== 'undefined' ? window.location.href : ''}`}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                  title="Compartir por correo electrónico"
                >
                  <Mail className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  <span className="sr-only">Email</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
