import React from 'react'
import type { CaseStudyHeaderBlock } from '@/payload-types'
import { Media } from '@/components/Media'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

export const CaseStudyHeaderBlock: React.FC<CaseStudyHeaderBlock> = (props) => {
  const { eyebrow, title, description, featuredImage, projectInfo } = props

  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
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
                  <Link href="/#work" className="ml-1 md:ml-2 hover:text-primary transition-colors">
                    Casos de Estudio
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

          {/* Header content */}
          <div className="text-center mb-12">
            {eyebrow && <span className="text-primary font-semibold">{eyebrow}</span>}
            <h1 className="text-4xl md:text-5xl font-display font-bold text-current mt-4 mb-6 leading-tight">
              {title}
            </h1>
            {description && (
              <p className="text-lg text-gray-700 dark:text-gray-300">{description}</p>
            )}
          </div>

          {/* Featured image */}
          {featuredImage && typeof featuredImage === 'object' && (
            <div className="w-full h-auto rounded-lg shadow-2xl mb-16 aspect-video overflow-hidden">
              <Media
                resource={featuredImage}
                className="w-full h-full object-cover"
                imgClassName="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Project info grid */}
          {projectInfo && projectInfo.length > 0 && (
            <div
              className={`grid grid-cols-1 md:grid-cols-${Math.min(projectInfo.length, 4)} gap-8 mb-16`}
            >
              {projectInfo.map((info, index) => (
                <div key={index} className="bg-card p-6 rounded-lg shadow-md text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{info.label}</p>
                  <p className="font-bold text-current text-lg mt-1">{info.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
