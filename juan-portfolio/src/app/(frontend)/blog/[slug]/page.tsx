import type { Metadata } from 'next'

// Related posts UI removed: schema does not include relatedPosts/categories
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
import { estimateReadingTimeFromLexical } from '@/utilities/estimateReadingTime'
import { generateMeta } from '@/utilities/generateMeta'
import { extractHeadingsFromLexical } from '@/utilities/extractHeadings'
import { TableOfContents } from '@/components/TableOfContents'
import TOCClient from '@/components/TableOfContents/client'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
// import { headers } from 'next/headers'

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
  const url = '/blog/' + slug
  const post = await queryPostBySlug({ slug })

  // If post not found, redirect/handle before accessing fields
  if (!post) return <PayloadRedirects url={url} />

  // Calculate reading time and excerpt
  const { minutes } = post.content ? estimateReadingTimeFromLexical(post.content) : { minutes: 1 }
  const excerpt = post.meta?.description || undefined
  const headings = post.content ? extractHeadingsFromLexical(post.content) : []

  // Related posts feature disabled (no relatedPosts/categories in schema)

  if (!post) return <PayloadRedirects url={url} />

  return (
    <article className="pb-16">
      <PageClient />

      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      {/* Breadcrumbs */}
      <div className="container mt-4">
        {/* @ts-expect-error Async Server Component */}
        {(await import('@/components/Breadcrumbs')).default({
          items: [
            { label: 'Inicio', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: post.title || 'Post' },
          ],
        })}
      </div>

      <PostHero post={post} excerpt={excerpt as string | null} readingTime={minutes} />

      <div className="pt-8">
        <div className="container">
          {(() => {
            const raw = (post as unknown as { sidebarBanners?: unknown })?.['sidebarBanners']
            const hasSidebarBanners = Array.isArray(raw) && raw.length > 0

            return (
              <div
                className={`grid grid-cols-1 gap-8 items-start ${
                  hasSidebarBanners
                    ? 'lg:grid-cols-[18rem_minmax(0,75ch)_22rem]'
                    : 'lg:grid-cols-[18rem_minmax(0,min(75ch,100%))_18rem]'
                }`}
              >
                {/* LEFT: TOC sticky on desktop */}
                <aside className="hidden lg:block lg:col-start-1 lg:col-span-1">
                  <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-auto">
                    {headings && headings.length > 0 && <TableOfContents headings={headings} />}
                  </div>
                </aside>

                {/* Main content */}
                <div
                  className={`${
                    hasSidebarBanners
                      ? 'lg:col-start-2 lg:col-span-1'
                      : 'lg:col-start-2 lg:col-span-2'
                  }`}
                >
                  {/* Mobile/tablet TOC above content */}
                  {headings && headings.length > 0 && (
                    <div className="lg:hidden mb-4">
                      <TableOfContents headings={headings} />
                    </div>
                  )}

                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    {(() => {
                      type Lexical = Post['content']['content']
                      const contentNode = post?.content as unknown
                      const contentData: Lexical | undefined =
                        contentNode &&
                        typeof contentNode === 'object' &&
                        'content' in (contentNode as Record<string, unknown>)
                          ? ((contentNode as { content?: Lexical }).content as Lexical | undefined)
                          : (contentNode as Lexical | undefined)
                      const hasNodes = Boolean(
                        (contentData as { root?: { children?: unknown[] } } | undefined)?.root
                          ?.children &&
                          (
                            (contentData as { root?: { children?: unknown[] } } | undefined)!.root!
                              .children as unknown[]
                          ).length > 0,
                      )
                      if (hasNodes) {
                        // @ts-expect-error accept Lexical JSON
                        return <RichText className="" data={contentData} enableGutter={false} />
                      }
                      return (
                        <div className="text-muted text-center py-12">
                          <p>Este artículo aún no tiene contenido.</p>
                          <p className="text-sm mt-2">
                            Agrega contenido desde el panel de administración.
                          </p>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Mobile/tablet banners below content */}
                  {(() => {
                    const raw = (post as unknown as { sidebarBanners?: unknown })?.[
                      'sidebarBanners'
                    ]
                    const sidebarBanners = Array.isArray(raw) ? raw : []
                    return sidebarBanners.length > 0 ? (
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
                            b && typeof b.openInNewTab === 'boolean'
                              ? (b.openInNewTab as boolean)
                              : false
                          const key =
                            b && (typeof b.id === 'string' || typeof b.id === 'number')
                              ? String(b.id)
                              : String(i)
                          const imgObj =
                            img && typeof img === 'object'
                              ? (img as Record<string, unknown>)
                              : undefined

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
                              {!img && title && (
                                <div className="p-4 text-sm font-medium">{title}</div>
                              )}
                            </a>
                          )
                        })}
                      </div>
                    ) : null
                  })()}

                  {/* Related posts disabled */}
                </div>

                {/* RIGHT: Sidebar banners */}
                <aside className="hidden lg:block lg:col-start-3 lg:col-span-1">
                  {(() => {
                    const raw = (post as unknown as { sidebarBanners?: unknown })?.[
                      'sidebarBanners'
                    ]
                    const sidebarBanners = Array.isArray(raw) ? raw : []
                    return sidebarBanners.length > 0 ? (
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
                            b && typeof b.openInNewTab === 'boolean'
                              ? (b.openInNewTab as boolean)
                              : false
                          const key =
                            b && (typeof b.id === 'string' || typeof b.id === 'number')
                              ? String(b.id)
                              : String(i)
                          const imgObj =
                            img && typeof img === 'object'
                              ? (img as Record<string, unknown>)
                              : undefined
                          return (
                            <a
                              key={key}
                              href={href}
                              target={newTab ? '_blank' : undefined}
                              rel={newTab ? 'noopener noreferrer' : undefined}
                              className="block border rounded overflow-hidden hover:shadow-lg transition-shadow"
                              aria-label={title || undefined}
                            >
                              {/* Use Media for payload-managed image */}
                              {img && typeof img !== 'string' ? (
                                <Media htmlElement={null} resource={img as PayloadMedia} />
                              ) : null}
                              {/* Fallback simple img if Media is not usable */}
                              {imgObj && typeof imgObj.url === 'string' && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={imgObj.url as string}
                                  alt={(imgObj.alt as string) || title || ''}
                                  className="w-full h-auto"
                                />
                              )}
                              {/* Basic text fallback */}
                              {!img && title && (
                                <div className="p-4 text-sm font-medium">{title}</div>
                              )}
                            </a>
                          )
                        })}
                      </div>
                    ) : null
                  })()}
                </aside>
              </div>
            )
          })()}

          {/* Client TOC enhancer */}
          <TOCClient />
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
