import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import PageClient from '../../page.client'
import { notFound } from 'next/navigation'
import { getServerSideURL } from '@/utilities/getURL'

export const revalidate = 600

const POSTS_PER_PAGE = 12

type Args = {
  params: Promise<{
    pageNumber: string
    locale: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { pageNumber, locale: rawLocale } = await paramsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'
  const payload = await getPayload({ config: configPromise })

  const sanitizedPageNumber = Number(pageNumber)
  if (!Number.isInteger(sanitizedPageNumber) || sanitizedPageNumber < 1) notFound()

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: POSTS_PER_PAGE,
    page: sanitizedPageNumber,
    overrideAccess: false,
    locale,
  })

  if (sanitizedPageNumber > 1 && posts.docs.length === 0) notFound()

  const localePrefix = locale === 'es' ? '' : '/en'
  const baseUrl = getServerSideURL()

  return (
    <div className="pt-8 pb-24">
      <PageClient />

      {/* rel="prev" / rel="next" — hoisted to <head> by React 19, signals pagination to crawlers */}
      {sanitizedPageNumber > 1 && (
        <link rel="prev" href={`${baseUrl}${localePrefix}/blog/page/${sanitizedPageNumber - 1}`} />
      )}
      {sanitizedPageNumber < posts.totalPages && (
        <link rel="next" href={`${baseUrl}${localePrefix}/blog/page/${sanitizedPageNumber + 1}`} />
      )}

      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>{locale === 'es' ? 'Posts' : 'Articles'}</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageRange
          collection="posts"
          currentPage={posts.page}
          limit={POSTS_PER_PAGE}
          totalDocs={posts.totalDocs}
          locale={locale}
        />
      </div>

      <CollectionArchive posts={posts.docs} />

      <div className="container">
        {posts.totalPages > 1 && (
          <Pagination
            locale={locale}
            page={posts.page}
            totalPages={posts.totalPages}
          />
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { pageNumber, locale: rawLocale } = await paramsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'
  const page = Number(pageNumber)
  const localePrefix = locale === 'es' ? '' : '/en'
  const baseUrl = getServerSideURL()

  const payload = await getPayload({ config: configPromise })
  const { totalDocs } = await payload.count({ collection: 'posts', overrideAccess: false })
  const totalPages = Math.ceil(totalDocs / POSTS_PER_PAGE)

  const canonical = `${baseUrl}${localePrefix}/blog/page/${page}`

  return {
    title:
      locale === 'es'
        ? `Blog · Página ${page} de ${totalPages}`
        : `Blog · Page ${page} of ${totalPages}`,
    alternates: {
      canonical,
      ...(page > 1 && { previous: `${baseUrl}${localePrefix}/blog/page/${page - 1}` }),
      ...(page < totalPages && { next: `${baseUrl}${localePrefix}/blog/page/${page + 1}` }),
    },
  }
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const { totalDocs } = await payload.count({
    collection: 'posts',
    overrideAccess: false,
  })

  const totalPages = Math.ceil(totalDocs / POSTS_PER_PAGE)
  const locales = ['en', 'es']
  const params: { pageNumber: string; locale: string }[] = []

  for (let i = 1; i <= totalPages; i++) {
    locales.forEach((locale) => {
      params.push({ pageNumber: String(i), locale })
    })
  }

  return params
}
