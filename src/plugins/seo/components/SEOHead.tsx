/**
 * SEOHead Component
 * Renders all SEO meta tags, JSON-LD schema, and Open Graph data
 */

import React from 'react'
import Head from 'next/head'
import { generateSchemaForDocument } from '@/plugins/seo/utils/schemaGenerator'

interface SEOHeadProps {
  title?: string
  description?: string
  canonical?: string
  noindex?: boolean
  nofollow?: boolean
  og?: {
    title?: string
    description?: string
    image?: string | { url: string }
    type?: string
  }
  twitter?: {
    card?: string
    title?: string
    description?: string
    image?: string | { url: string }
  }
  schema?: {
    type?: string
    customSchema?: string
    autoGenerate?: boolean
  }
  doc?: {
    title: string
    slug: string
    meta?: {
      description?: string
      schema?: {
        type?: string
        customSchema?: string
        autoGenerate?: boolean
      }
    }
    publishedAt?: string
    updatedAt?: string
    hero?: {
      image?: string | { url: string }
    }
    populatedAuthors?: Array<{
      name: string
      slug: string
    }>
  }
  siteConfig?: {
    url: string
    name: string
    logo?: string
    twitterHandle?: string
  }
  collectionSlug?: string
}

export async function SEOHead({
  title,
  description,
  canonical,
  noindex = false,
  nofollow = false,
  og,
  twitter,
  schema,
  doc,
  siteConfig,
  collectionSlug,
}: SEOHeadProps) {
  // Generate JSON-LD schema if doc and siteConfig are provided
  let schemaData = ''
  if (doc && siteConfig) {
    try {
      schemaData = await generateSchemaForDocument(doc, siteConfig, collectionSlug)
    } catch (error) {
      console.error('Error generating schema:', error)
    }
  } else if (schema?.customSchema) {
    schemaData = schema.customSchema
  }

  // Determine OG image URL
  const getImageUrl = (image: string | { url: string } | undefined): string => {
    if (!image) return ''
    if (typeof image === 'string') return image
    return image.url
  }

  const ogImage = getImageUrl(og?.image)
  const twitterImage = getImageUrl(twitter?.image) || ogImage

  // Build robots meta
  const robots = []
  if (noindex) robots.push('noindex')
  if (nofollow) robots.push('nofollow')
  const robotsContent = robots.length > 0 ? robots.join(', ') : 'index, follow'

  return (
    <Head>
      {/* Basic Meta Tags */}
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      {canonical && <link rel="canonical" href={canonical} />}
      <meta name="robots" content={robotsContent} />

      {/* Open Graph */}
      {og?.title && <meta property="og:title" content={og.title} />}
      {og?.description && <meta property="og:description" content={og.description} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      {og?.type && <meta property="og:type" content={og.type} />}
      {canonical && <meta property="og:url" content={canonical} />}
      {siteConfig?.name && <meta property="og:site_name" content={siteConfig.name} />}

      {/* Twitter Card */}
      {twitter?.card && <meta name="twitter:card" content={twitter.card} />}
      {siteConfig?.twitterHandle && (
        <meta name="twitter:site" content={`@${siteConfig.twitterHandle}`} />
      )}
      {twitter?.title && <meta name="twitter:title" content={twitter.title} />}
      {twitter?.description && <meta name="twitter:description" content={twitter.description} />}
      {twitterImage && <meta name="twitter:image" content={twitterImage} />}

      {/* JSON-LD Schema */}
      {schemaData && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaData }} />
      )}
    </Head>
  )
}

/**
 * Client-side SEO component for use in client components
 */
export function ClientSEOHead(props: SEOHeadProps) {
  return (
    <>
      {/* Basic Meta Tags */}
      {props.title && <title>{props.title}</title>}
      {props.description && <meta name="description" content={props.description} />}
      {props.canonical && <link rel="canonical" href={props.canonical} />}
      <meta
        name="robots"
        content={props.noindex || props.nofollow ? 'noindex, nofollow' : 'index, follow'}
      />

      {/* Open Graph */}
      {props.og?.title && <meta property="og:title" content={props.og.title} />}
      {props.og?.description && <meta property="og:description" content={props.og.description} />}
      {props.og?.image && (
        <meta
          property="og:image"
          content={typeof props.og.image === 'string' ? props.og.image : props.og.image.url}
        />
      )}
      {props.og?.type && <meta property="og:type" content={props.og.type} />}

      {/* Twitter Card */}
      {props.twitter?.card && <meta name="twitter:card" content={props.twitter.card} />}
      {props.twitter?.title && <meta name="twitter:title" content={props.twitter.title} />}
      {props.twitter?.description && (
        <meta name="twitter:description" content={props.twitter.description} />
      )}
      {props.twitter?.image && (
        <meta
          name="twitter:image"
          content={
            typeof props.twitter.image === 'string' ? props.twitter.image : props.twitter.image.url
          }
        />
      )}
    </>
  )
}
