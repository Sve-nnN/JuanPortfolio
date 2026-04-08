/**
 * @file Defines the page for a specific page of blog posts.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import PageClient from '../../page.client'
import { notFound } from 'next/navigation'

export const revalidate = 600

/**
 * @typedef {object} Args
 * @property {Promise<{ pageNumber: string, locale: string }>} params - The page parameters.
 */
type Args = {
  params: Promise<{
    pageNumber: string
    locale: string
  }>
}

/**
 * The page component for a specific page of blog posts.
 * @param {Args} props - The component props.
 * @returns {Promise<React.ReactElement>} A promise that resolves to the page component.
 */
export default async function Page({ params: paramsPromise }: Args) {
  const { pageNumber, locale: rawLocale } = await paramsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'
  const payload = await getPayload({ config: configPromise })

  const sanitizedPageNumber = Number(pageNumber)

  if (!Number.isInteger(sanitizedPageNumber)) notFound()

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 12,
    page: sanitizedPageNumber,
    overrideAccess: false,
    locale,
  })

  return (
    <div className="pt-8 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>{locale === 'es' ? 'Posts' : 'Articles'}</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageRange
          collection="posts"
          currentPage={posts.page}
          limit={12}
          totalDocs={posts.totalDocs}
          locale={locale}
        />
      </div>

      <CollectionArchive posts={posts.docs} />

      <div className="container">
        {posts?.page && posts?.totalPages > 1 && (
          <Pagination page={posts.page} totalPages={posts.totalPages} />
        )}
      </div>
    </div>
  )
}

/**
 * Generates metadata for the page.
 * @param {Args} props - The component props.
 * @returns {Promise<Metadata>} A promise that resolves to the page metadata.
 */
export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { pageNumber, locale } = await paramsPromise
  return {
    title: locale === 'es' ? `JuanTech Posts Página ${pageNumber || ''}` : `JuanTech Articles Page ${pageNumber || ''}`,
  }
}

/**
 * Generates static parameters for all pages of blog posts across all locales.
 * @returns {Promise<Array<{ pageNumber: string, locale: string }>>} A promise that resolves to an array of parameters.
 */
export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const { totalDocs } = await payload.count({
    collection: 'posts',
    overrideAccess: false,
  })

  const locales = ['en', 'es']
  const totalPages = Math.ceil(totalDocs / 10)

  const params: { pageNumber: string, locale: string }[] = []

  for (let i = 1; i <= totalPages; i++) {
    locales.forEach(locale => {
      params.push({ pageNumber: String(i), locale })
    })
  }

  return params
}