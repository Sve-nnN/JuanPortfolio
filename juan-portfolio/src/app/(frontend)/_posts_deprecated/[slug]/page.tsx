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
import {
  generateArticleSchema,
  generateBreadcrumbSchema,
  mergeSchemas,
  type BreadcrumbItem,
} from '@/utilities/schema'

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
  const postCategories = post.categories || []
  const mainCategory =
    Array.isArray(postCategories) && postCategories.length > 0
      ? typeof postCategories[0] === 'string'
        ? postCategories[0]
        : postCategories[0]?.id
      : null

  const raw = (post as unknown as { sidebarBanners?: unknown })?.sidebarBanners
  const sidebarBanners = Array.isArray(raw) ? raw : []
  const hasBanners = sidebarBanners.length > 0

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

  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || ''
  const mainCategoryObj = Array.isArray(postCategories) && postCategories.length > 0
    ? typeof postCategories[0] === 'object' ? postCategories[0] : null
    : null
  const mainCategoryName = mainCategoryObj && typeof mainCategoryObj === 'object' && 'title' in mainCategoryObj
    ? String(mainCategoryObj.title)
    : 'Blog'
  const mainCategorySlug = mainCategoryObj && typeof mainCategoryObj === 'object' && 'slug' in mainCategoryObj
    ? String(mainCategoryObj.slug)
    : null

  const breadcrumbItems: BreadcrumbItem[] = [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
  ]
  if (mainCategorySlug) {
    breadcrumbItems.push({ name: mainCategoryName, url: `/blog/${mainCategorySlug}` })
  }
  breadcrumbItems.push({ name: post.title || 'Post', url: `/posts/${post.slug}` })

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems)

  const authors = Array.isArray(post.authors) && post.authors.length > 0
    ? post.authors.map(author => {
        const authorObj = typeof author === 'object' ? author : null
        if (!authorObj) return null
        const name = 'name' in authorObj ? String(authorObj.name) : undefined
        const url = authorObj.id ? `${baseUrl}/author/${authorObj.id}` : undefined
        return name && url ? { name, url } : null
      }).filter((a): a is { name: string; url: string } => a != null)
    : undefined

  const categoryNames = Array.isArray(postCategories)
    ? postCategories
        .map(cat => {
          const catObj = typeof cat === 'object' ? cat : null
          return catObj && 'title' in catObj ? String(catObj.title) : null
        })
        .filter((name): name is string => name != null)
    : undefined

  const heroImageUrl = typeof post.content === 'object' && post.content && 'heroImage' in post.content
    ? typeof post.content.heroImage === 'object' && post.content.heroImage && 'url' in post.content.heroImage
      ? String(post.content.heroImage.url)
      : undefined
    : undefined

  const metaDesc = typeof post.meta === 'object' && post.meta && 'description' in post.meta
    ? String(post.meta.description)
    : undefined

  const articleSchema = generateArticleSchema({
    headline: post.title || '',
    description: metaDesc,
    image: heroImageUrl,
    datePublished: post.publishedAt || post.createdAt || new Date().toISOString(),
    dateModified: post.updatedAt || post.createdAt || new Date().toISOString(),
    author: authors,
    categories: categoryNames,
  })

  const schema = mergeSchemas([articleSchema, breadcrumbSchema])

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
