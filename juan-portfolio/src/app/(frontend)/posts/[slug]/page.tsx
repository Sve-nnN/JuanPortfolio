import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import RichText from '@/components/RichText'
import { Media } from '@/components/Media'
import type { Media as PayloadMedia } from '@/payload-types'

import type { Post } from '@/payload-types'

import { PostHero } from '@/heros/PostHero'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { JsonLd } from '@/components/JsonLd'

const RelatedPostsServer = dynamic(() => import('@/components/RelatedPostsServer'))

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = posts.docs.map(({ slug }) => {
    return { slug }
  })

  return params
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Post({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = '' } = await paramsPromise
  const url = '/posts/' + slug
  const post = await queryPostBySlug({ slug })

  if (!post) return <PayloadRedirects url={url} />

  // Obtener la categoría principal del post
  const categories = post.categories || []
  const mainCategory =
    Array.isArray(categories) && categories.length > 0
      ? typeof categories[0] === 'string'
        ? categories[0]
        : categories[0]?.id
      : null

  const raw = (post as unknown as { sidebarBanners?: unknown })?.sidebarBanners
  const sidebarBanners = Array.isArray(raw) ? raw : []
  const hasBanners = sidebarBanners.length > 0

  // Procesar contenido
  type Lexical = Post['content']['content']
  const contentNode = post?.content as unknown
  const contentData: Lexical | undefined =
    contentNode &&
      typeof contentNode === 'object' &&
      'content' in (contentNode as Record<string, unknown>)
      ? ((contentNode as { content?: Lexical }).content as Lexical | undefined)
      : (contentNode as Lexical | undefined)
  const hasNodes = Boolean(
    (contentData as { root?: { children?: unknown[] } } | undefined)?.root?.children?.length,
  )

  // Calculate JSON-LD
  // @ts-ignore
  const customJsonLd = post.meta?.jsonLD
  let schema = customJsonLd

  if (!schema) {
    const metaTitle = post.meta?.title || post.title
    const metaDesc = post.meta?.description
    // @ts-ignore
    const metaImage = post.meta?.image?.url || post.meta?.image?.sizes?.og?.url

    schema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: metaTitle,
      description: metaDesc,
      image: metaImage ? `${process.env.NEXT_PUBLIC_SERVER_URL}${metaImage}` : undefined,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: {
        '@type': 'Person',
        name: 'Juan Carlos Angulo', // Fallback or fetch specific author
      },
    }
  }

  return (
    <article className="pb-16">
      <JsonLd schema={schema} />
      <PageClient />

      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <PostHero post={post} />

      <div className="pt-8">
        <div className="container">
          <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-start`}>
            {/* Main content */}
            <div className={hasBanners ? 'lg:col-span-8' : 'lg:col-span-12'}>
              <div className="prose prose-lg dark:prose-invert max-w-none">
                {hasNodes && contentData ? (
                  <RichText className="" data={contentData} enableGutter={false} />
                ) : (
                  <div className="text-muted text-center py-12">
                    <p>Este artículo aún no tiene contenido.</p>
                    <p className="text-sm mt-2">
                      Agrega contenido desde el panel de administración.
                    </p>
                  </div>
                )}
              </div>

              {/* Componente de posts relacionados */}
              {mainCategory && (
                <div className="mt-12">
                  <RelatedPostsServer currentPostId={post.id} categoryId={mainCategory} />
                </div>
              )}
            </div>

            {/* Mobile banners below content */}
            {hasBanners && (
              <div className="lg:hidden mt-8 space-y-4">
                {sidebarBanners.map((banner: unknown, i: number) => {
                  const b =
                    banner && typeof banner === 'object'
                      ? (banner as Record<string, unknown>)
                      : undefined
                  const img = b && 'image' in b ? (b.image as unknown) : null
                  const href = b && typeof b.url === 'string' ? (b.url as string) : '#'
                  const title = b && typeof b.title === 'string' ? (b.title as string) : ''
                  const newTab =
                    b && typeof b.openInNewTab === 'boolean' ? (b.openInNewTab as boolean) : false
                  const key =
                    b && (typeof b.id === 'string' || typeof b.id === 'number')
                      ? String(b.id)
                      : String(i)
                  const imgObj =
                    img && typeof img === 'object' ? (img as Record<string, unknown>) : undefined

                  return (
                    <a
                      key={key}
                      href={href}
                      target={newTab ? '_blank' : undefined}
                      rel={newTab ? 'noopener noreferrer' : undefined}
                      className="block border rounded overflow-hidden hover:shadow-lg transition-shadow"
                      aria-label={title || undefined}
                    >
                      {img && typeof img !== 'string' ? (
                        <Media htmlElement={null} resource={img as PayloadMedia} />
                      ) : null}
                      {imgObj && typeof imgObj.url === 'string' && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imgObj.url as string}
                          alt={(imgObj.alt as string) || title || ''}
                          className="w-full h-auto"
                        />
                      )}
                      {!img && title && <div className="p-4 text-sm font-medium">{title}</div>}
                    </a>
                  )
                })}
              </div>
            )}

            {/* Sidebar banners on desktop */}
            {hasBanners && (
              <aside className="hidden lg:block lg:col-span-4">
                <div className="sticky top-24 space-y-4 max-h-[calc(100vh-6rem)] overflow-auto">
                  {sidebarBanners.map((banner: unknown, i: number) => {
                    const b =
                      banner && typeof banner === 'object'
                        ? (banner as Record<string, unknown>)
                        : undefined
                    const img = b && 'image' in b ? (b.image as unknown) : null
                    const href = b && typeof b.url === 'string' ? (b.url as string) : '#'
                    const title = b && typeof b.title === 'string' ? (b.title as string) : ''
                    const newTab =
                      b && typeof b.openInNewTab === 'boolean' ? (b.openInNewTab as boolean) : false
                    const key =
                      b && (typeof b.id === 'string' || typeof b.id === 'number')
                        ? String(b.id)
                        : String(i)
                    const imgObj =
                      img && typeof img === 'object' ? (img as Record<string, unknown>) : undefined
                    return (
                      <a
                        key={key}
                        href={href}
                        target={newTab ? '_blank' : undefined}
                        rel={newTab ? 'noopener noreferrer' : undefined}
                        className="block border rounded overflow-hidden hover:shadow-lg transition-shadow"
                        aria-label={title || undefined}
                      >
                        {img && typeof img !== 'string' ? (
                          <Media htmlElement={null} resource={img as PayloadMedia} />
                        ) : null}
                        {imgObj && typeof imgObj.url === 'string' && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imgObj.url as string}
                            alt={(imgObj.alt as string) || title || ''}
                            className="w-full h-auto"
                          />
                        )}
                        {!img && title && <div className="p-4 text-sm font-medium">{title}</div>}
                      </a>
                    )
                  })}
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const post = await queryPostBySlug({ slug })

  return generateMeta({ doc: post })
}

const queryPostBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    depth: 2,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})
