import React from 'react'
import type { Schema } from '@/utilities/schema/types'
import type { Post, User } from '@/payload-types'

interface JsonLdProps {
  schema?: Schema | Schema[] | null | undefined
  post?: Post | null
  locale?: 'en' | 'es'
  siteUrl?: string
}

export const JsonLd = ({ schema, post, locale = 'es', siteUrl = 'https://juan-tech.com' }: JsonLdProps) => {
  const schemas: Schema[] = []

  // Add explicit schema if provided
  if (schema) {
    if (Array.isArray(schema)) {
      schemas.push(...schema.filter(s => s != null))
    } else {
      schemas.push(schema)
    }
  }

  // Auto-generate Article Schema if post is provided
  if (post) {
    const authors = post.populatedAuthors || []
    
    const articleSchema: Schema = {
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.meta?.description || '',
      datePublished: post.publishedAt || post.createdAt,
      dateModified: post.updatedAt || post.publishedAt || post.createdAt,
      author: authors.map(a => ({
        '@type': 'Person',
        name: (a as User).name,
        url: `${siteUrl}${locale === 'es' ? '' : '/en'}/authors/${(a as User).slug}`,
        jobTitle: (a as User).jobTitle,
      })),
      image: post.meta?.image ? (post.meta.image as any).url : undefined,
      publisher: {
        '@id': `${siteUrl}/#organization`,
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${siteUrl}${locale === 'es' ? '' : '/en'}/blog/${post.slug}`,
      }
    }
    schemas.push(articleSchema)

    // FAQ Schema if FAQs exist in categories or post content blocks
    const contentBlocks = (post.content?.content as any)?.root?.children || []
    const faqBlock = contentBlocks.find((b: any) => b.type === 'block' && b.fields?.blockType === 'faq')
    const faqs = faqBlock?.fields?.faqs || (post as any).faqs || []

    if (faqs.length > 0) {
      const faqSchema: Schema = {
        '@type': 'FAQPage',
        mainEntity: faqs.map((f: any) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.answer,
          }
        }))
      }
      schemas.push(faqSchema)
    }
  }

  if (schemas.length === 0) return null

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': schemas,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  )
}
