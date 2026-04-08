import { describe, it, expect } from 'vitest'
import { parsePostFile, validatePost, buildPostData } from '../../../../src/scripts/sync/postParser'
import type { ParsedPost } from '../../../../src/scripts/sync/types'

describe('parsePostFile', () => {
  it('parses title and body from a frontmatter file', () => {
    const raw = '---\ntitle: My Post\nidioma: es\n---\nContent here'
    const result = parsePostFile('post.md', raw)
    expect(result.title).toBe('My Post')
    expect(result.body.trim()).toBe('Content here')
    expect(result.locale).toBe('es')
  })

  it('derives locale from .en.md suffix, ignoring frontmatter idioma', () => {
    const raw = '---\ntitle: My Post\nidioma: es\n---\nContent'
    const result = parsePostFile('post.en.md', raw)
    expect(result.locale).toBe('en')
  })

  it('derives locale from frontmatter idioma when filename has no locale suffix', () => {
    const raw = '---\ntitle: My Post\nidioma: en\n---\nContent'
    const result = parsePostFile('post.md', raw)
    expect(result.locale).toBe('en')
  })

  it('defaults locale to "es" when no suffix and no frontmatter idioma', () => {
    const raw = '---\ntitle: My Post\n---\nContent'
    const result = parsePostFile('post.md', raw)
    expect(result.locale).toBe('es')
  })

  it('uses slug from frontmatter when present', () => {
    const raw = '---\ntitle: My Post\nslug: custom-slug\n---\nContent'
    const result = parsePostFile('post.md', raw)
    expect(result.slug).toBe('custom-slug')
  })

  it('derives slug from filename when not in frontmatter', () => {
    const raw = '---\ntitle: My Post\n---\nContent'
    const result = parsePostFile('development/my-article.en.md', raw)
    expect(result.slug).toBe('my-article')
  })

  it('parses all standard frontmatter fields', () => {
    const raw = [
      '---',
      'title: Full Post',
      'slug: full-post',
      'idioma: es',
      'publishedAt: 2026-01-01T00:00:00.000Z',
      'authors:',
      '  - juan-carlos-angulo',
      'categories:',
      '  - development',
      'primary_keywords:',
      '  - nextjs',
      'semantic_keywords:',
      '  - react',
      '  - typescript',
      'metaTitle: Full Post | Meta',
      'metaDescription: A description',
      'status: published',
      '---',
      'Body content',
    ].join('\n')

    const result = parsePostFile('full-post.md', raw)
    expect(result.frontmatter.authors).toEqual(['juan-carlos-angulo'])
    expect(result.frontmatter.categories).toEqual(['development'])
    expect(result.frontmatter.primary_keywords).toEqual(['nextjs'])
    expect(result.frontmatter.semantic_keywords).toEqual(['react', 'typescript'])
    expect(result.frontmatter.metaTitle).toBe('Full Post | Meta')
    expect(result.frontmatter.metaDescription).toBe('A description')
    expect(result.frontmatter.status).toBe('published')
  })
})

describe('validatePost', () => {
  it('returns an error for a missing title', () => {
    const post: ParsedPost = {
      title: '',
      slug: 'post',
      locale: 'es',
      body: 'content',
      frontmatter: {},
    }
    const errors = validatePost(post)
    expect(errors).toContain('Missing required field: title')
  })

  it('returns empty array for a valid post', () => {
    const post: ParsedPost = {
      title: 'Valid Post',
      slug: 'valid-post',
      locale: 'es',
      body: 'content',
      frontmatter: { title: 'Valid Post' },
    }
    expect(validatePost(post)).toHaveLength(0)
  })
})

describe('buildPostData', () => {
  const basePost: ParsedPost = {
    title: 'Test Post',
    slug: 'test-post',
    locale: 'es',
    body: 'Hello world',
    frontmatter: {
      title: 'Test Post',
      publishedAt: '2026-01-15T00:00:00.000Z',
    },
  }

  const emptyResolved = {
    primaryKeywordId: undefined,
    semanticKeywordIds: [] as string[],
    authorIds: [] as string[],
    categoryIds: [] as string[],
  }

  it('sets status to published by default', () => {
    const data = buildPostData(basePost, emptyResolved)
    expect(data._status).toBe('published')
  })

  it('sets status to draft when uploaded is false', () => {
    const post: ParsedPost = { ...basePost, frontmatter: { ...basePost.frontmatter, uploaded: false } }
    const data = buildPostData(post, emptyResolved)
    expect(data._status).toBe('draft')
  })

  it('uses explicit status from frontmatter', () => {
    const post: ParsedPost = { ...basePost, frontmatter: { ...basePost.frontmatter, status: 'draft' } }
    const data = buildPostData(post, emptyResolved)
    expect(data._status).toBe('draft')
  })

  it('maps title, slug and meta fields correctly', () => {
    const post: ParsedPost = {
      ...basePost,
      frontmatter: {
        ...basePost.frontmatter,
        metaTitle: 'SEO Title',
        metaDescription: 'SEO desc',
      },
    }
    const data = buildPostData(post, emptyResolved)
    expect(data.title).toBe('Test Post')
    expect(data.slug).toBe('test-post')
    expect(data.meta.title).toBe('SEO Title')
    expect(data.meta.description).toBe('SEO desc')
  })

  it('includes resolved relationship IDs', () => {
    const resolved = {
      primaryKeywordId: 'kw-1',
      semanticKeywordIds: ['kw-2', 'kw-3'],
      authorIds: ['user-1'],
      categoryIds: ['cat-1'],
    }
    const data = buildPostData(basePost, resolved)
    expect(data.primaryKeyword).toBe('kw-1')
    expect(data.semanticKeywords).toEqual(['kw-2', 'kw-3'])
    expect(data.authors).toEqual(['user-1'])
    expect(data.categories).toEqual(['cat-1'])
  })

  it('produces a Lexical content node from the body', () => {
    const data = buildPostData(basePost, emptyResolved)
    const lexical = data.content.content as { root: { type: string } }
    expect(lexical.root).toBeDefined()
    expect(lexical.root.type).toBe('root')
  })
})
