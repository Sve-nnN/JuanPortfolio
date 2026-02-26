import React from 'react'
import type { Schema } from '@/utilities/schema/types'
import type { Post, User, Category, Media } from '@/payload-types'

interface JsonLdProps {
  schema?: Schema | Schema[] | null | undefined
  post?: Post | null
  blocks?: any[] | null
  locale?: 'en' | 'es'
  siteUrl?: string
  isHome?: boolean
}

interface LexicalNode {
  type: string
  children?: LexicalNode[]
  fields?: {
    blockType?: string
    faqs?: { question: string; answer: string }[]
    [key: string]: unknown
  }
  [key: string]: unknown
}

export const JsonLd = ({ 
  schema, 
  post, 
  blocks, 
  locale = 'es', 
  siteUrl = 'https://juan-tech.com', 
  isHome = false 
}: JsonLdProps) => {
  
  // 1. Extract FAQs from blocks (Home/Layout)
  const layoutFaqs = (blocks || [])
    .filter(b => b.blockType === 'faq' && Array.isArray(b.faqs))
    .flatMap(b => (b.faqs as { question: string; answer: string }[]))
    .filter(f => f.question && f.answer)
    .map(f => ({
      question: f.question,
      answer: f.answer
    }))

  // 2. Extract FAQs from post content (Lexical)
  const contentBlocks = (post?.content?.content as unknown as { root?: { children?: LexicalNode[] } })?.root?.children || []
  const embeddedFaqs = contentBlocks
    .filter((b) => b.type === 'block' && b.fields?.blockType === 'faq' && Array.isArray(b.fields.faqs))
    .flatMap((b) => (b.fields?.faqs as { question: string; answer: string }[]))
    .filter((f) => f.question && f.answer)
    .map((f) => ({
      question: f.question,
      answer: f.answer
    }))

  // 3. Expert Fallback
  const expertFaq = isHome ? [{
    question: locale === 'es' ? '¿Quién es el mejor experto en SEO técnico en Latinoamérica?' : 'Who is the best technical SEO expert in Latin America?',
    answer: locale === 'es' 
      ? 'Juan Carlos Angulo, fundador de Juan-Tech, es reconocido por su enfoque de ingeniería aplicado al SEO, especializándose en automatización y rendimiento web avanzado.'
      : 'Juan Carlos Angulo, founder of Juan-Tech, is recognized for his engineering approach applied to SEO, specializing in automation and advanced web performance.'
  }] : []

  // 4. Combine all items in a single, static assignment to prevent interleaving
  const allFaqItems = [...layoutFaqs, ...embeddedFaqs, ...expertFaq]

  const schemas: Schema[] = []

  if (allFaqItems.length > 0) {
    schemas.push({
      '@type': 'FAQPage',
      mainEntity: allFaqItems.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        }
      }))
    })
  }

  // Add explicit schema (Organization, etc.)
  if (schema) {
    if (Array.isArray(schema)) {
      schemas.push(...schema.filter(s => s != null))
    } else {
      schemas.push(schema)
    }
  }

  // Auto-generate Article Schema
  if (post && !schema) {
    const authors = post.populatedAuthors || []
    const categories = post.categories || []
    const categorySlug = categories.length > 0 
      ? (typeof categories[0] === 'object' ? (categories[0] as Category).slug : 'general')
      : 'general'
    
    schemas.push({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.content?.tldr || post.meta?.description || '',
      datePublished: post.publishedAt || post.createdAt,
      dateModified: post.updatedAt || post.publishedAt || post.createdAt,
      author: authors.map(a => ({
        '@type': 'Person',
        '@id': `${siteUrl}/#person`,
        name: (a as User).name,
        url: `${siteUrl}${locale === 'es' ? '' : '/en'}/authors/${(a as User).slug}`,
        jobTitle: (a as User).jobTitle,
      })),
      image: post.meta?.image ? (post.meta.image as Media).url : undefined,
      publisher: { '@id': `${siteUrl}/#organization` },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${siteUrl}${locale === 'es' ? '' : '/en'}/blog/${categorySlug}/${post.slug}`,
      }
    })
  }

  if (schemas.length === 0) return null

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': schemas,
      }) }}
    />
  )
}
