import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import PageClient from './page.client'
import type { Post } from '@/payload-types'
import { JsonLd } from '@/components/JsonLd'

type Args = {
  params: Promise<{
    locale: string
  }>
  searchParams: Promise<{
    q: string
  }>
}
export default async function Page({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args) {
  const { locale: rawLocale } = await paramsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'
  const { q: query } = await searchParamsPromise
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'search',
    depth: 1,
    limit: 12,
    locale,
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
    },
    // pagination: false reduces overhead if you don't need totalDocs
    pagination: false,
    ...(query
      ? {
          where: {
            or: [
              {
                title: {
                  like: query,
                },
              },
              {
                'meta.description': {
                  like: query,
                },
              },
              {
                'meta.title': {
                  like: query,
                },
              },
              {
                slug: {
                  like: query,
                },
              },
            ],
          },
        }
      : {}),
  })

  const searchSchema = query
    ? {
        '@type': 'SearchResultsPage',
        mainEntity: {
          '@type': 'ItemList',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          itemListElement: posts.docs.map((post: any, index: number) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'WebPage',
              url: `https://juan-tech.com${locale === 'es' ? '' : '/en'}/blog/${post.slug}`,
              name: post.title,
            },
          })),
        },
      }
    : null

  return (
    <div className="pt-24 pb-24">
      {searchSchema && <JsonLd schema={searchSchema as any} />}
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none text-center">
          <h1 className="mb-8 lg:mb-16">
            {query
              ? locale === 'es'
                ? `resultados sobre: ${query}`
                : `results for: ${query}`
              : locale === 'es'
                ? 'búsqueda'
                : 'search'}
          </h1>
        </div>
      </div>

      {posts.totalDocs > 0 ? (
        <CollectionArchive posts={posts.docs as Post[]} />
      ) : (
        <div className="container">
          {locale === 'es' ? 'No se encontraron resultados.' : 'No results found.'}
        </div>
      )}
    </div>
  )
}

import { generateMeta } from '@/utilities/generateMeta'

export async function generateMetadata({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args): Promise<Metadata> {
  const { locale: rawLocale } = await paramsPromise
  const { q: query } = await searchParamsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'

  const title = query
    ? locale === 'es'
      ? `resultados sobre: ${query}`
      : `results for: ${query}`
    : locale === 'es'
      ? 'búsqueda'
      : 'search'

  return generateMeta({
    doc: { title },
    locale,
    path: '/search',
  })
}
