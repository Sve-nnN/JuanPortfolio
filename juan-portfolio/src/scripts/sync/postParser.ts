import matter from 'gray-matter'
import { convertMarkdownToLexical } from '../utils/markdownConverter'
import { detectLocale, getBaseSlug } from './localeDetector'
import type { ParsedPost, PostFrontmatter, ResolvedIds, PayloadPostData } from './types'

export function parsePostFile(filePath: string, rawContent: string): ParsedPost {
  const { data, content: body } = matter(rawContent)
  const frontmatter = data as PostFrontmatter
  const locale = detectLocale(filePath, frontmatter.idioma)
  const slug = frontmatter.slug ?? getBaseSlug(filePath)
  const title = frontmatter.title ?? ''
  const tldr = frontmatter.tldr ?? ''
  return { slug, locale, title, body, tldr, frontmatter }
}

/**
 * Validates a parsed post, returning a list of human-readable error strings.
 * An empty array means the post is valid.
 */
export function validatePost(post: ParsedPost): string[] {
  const errors: string[] = []
  if (!post.title) errors.push('Missing required field: title')
  return errors
}

/**
 * Builds the Payload CMS data payload from a parsed post and pre-resolved relationship IDs.
 * Pure function — no side effects.
 */
export function buildPostData(post: ParsedPost, resolved: ResolvedIds): PayloadPostData {
  const lexicalContent = convertMarkdownToLexical(
    post.body,
    post.frontmatter.primary_keywords?.[0],
    post.locale,
  )

  const status =
    post.frontmatter.status ??
    (post.frontmatter.uploaded === false ? 'draft' : 'published')

  return {
    title: post.title,
    slug: post.slug,
    tldr: post.tldr,
    content: { content: lexicalContent },
    primaryKeyword: resolved.primaryKeywordId,
    semanticKeywords: resolved.semanticKeywordIds,
    publishedAt: post.frontmatter.publishedAt ?? new Date().toISOString(),
    _status: status,
    meta: {
      title: post.frontmatter.metaTitle,
      description: post.frontmatter.metaDescription,
    },
    authors: resolved.authorIds,
    categories: resolved.categoryIds,
  }
}
