import { describe, it, expect } from 'vitest'
import { detectLocale, getBaseSlug, isMdFile } from '../../../../src/scripts/sync/localeDetector'

describe('detectLocale', () => {
  it('detects English from .en.md suffix', () => {
    expect(detectLocale('article.en.md')).toBe('en')
  })

  it('detects Spanish from .es.md suffix', () => {
    expect(detectLocale('article.es.md')).toBe('es')
  })

  it('defaults to Spanish for plain .md', () => {
    expect(detectLocale('article.md')).toBe('es')
  })

  it('reads frontmatter locale when no locale suffix in filename', () => {
    expect(detectLocale('article.md', 'en')).toBe('en')
  })

  it('filename suffix takes precedence over frontmatter locale', () => {
    expect(detectLocale('article.en.md', 'es')).toBe('en')
  })

  it('works with full relative paths', () => {
    expect(detectLocale('development/nextjs-portfolio.en.md')).toBe('en')
    expect(detectLocale('cs-fundamentals/big-o.md')).toBe('es')
  })
})

describe('getBaseSlug', () => {
  it('strips .md extension', () => {
    expect(getBaseSlug('article.md')).toBe('article')
  })

  it('strips .en.md extension', () => {
    expect(getBaseSlug('article.en.md')).toBe('article')
  })

  it('strips .es.md extension', () => {
    expect(getBaseSlug('article.es.md')).toBe('article')
  })

  it('uses only the basename from a full path', () => {
    expect(getBaseSlug('development/nextjs-portfolio.en.md')).toBe('nextjs-portfolio')
    expect(getBaseSlug('seo/guia-keyword-research.md')).toBe('guia-keyword-research')
  })

  it('handles filenames with multiple dots in the name', () => {
    expect(getBaseSlug('my.post.en.md')).toBe('my.post')
  })
})

describe('isMdFile', () => {
  it('returns true for .md files', () => {
    expect(isMdFile('post.md')).toBe(true)
  })

  it('returns true for .en.md files', () => {
    expect(isMdFile('post.en.md')).toBe(true)
  })

  it('returns true for .es.md files', () => {
    expect(isMdFile('post.es.md')).toBe(true)
  })

  it('returns false for non-md files', () => {
    expect(isMdFile('post.json')).toBe(false)
    expect(isMdFile('post.ts')).toBe(false)
    expect(isMdFile('post.html')).toBe(false)
  })

  it('returns false for the sync state JSON file', () => {
    expect(isMdFile('content-sync.json')).toBe(false)
  })
})
