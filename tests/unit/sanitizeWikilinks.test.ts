import { describe, it, expect } from 'vitest'
import { sanitizeWikilinks } from '../../src/scripts/sync/sanitizeWikilinks'

describe('sanitizeWikilinks', () => {
  it('replaces [[slug|label]] with the label text', () => {
    const { body, stripped } = sanitizeWikilinks('ver [[estrategia-seo|SEO]] hoy')
    expect(body).toBe('ver SEO hoy')
    expect(stripped).toBe(1)
  })

  it('falls back to humanized slug when no label', () => {
    const { body } = sanitizeWikilinks('ver [[pilas-y-colas]] aqui')
    expect(body).toBe('ver pilas y colas aqui')
  })

  it('collapses malformed half-converted links [[Label](url) -> [Label](url)', () => {
    const { body } = sanitizeWikilinks('- [[Technical SEO](https://x.com/a) Guide')
    expect(body).toBe('- [Technical SEO](https://x.com/a) Guide')
  })

  it('collapses double-wrapped links [[Text](url1)](url2) -> [Text](url1)', () => {
    const { body, stripped } = sanitizeWikilinks(
      'la [[velocidad](https://x.com/a)](/blog/general/a) importa',
    )
    expect(body).toBe('la [velocidad](https://x.com/a) importa')
    expect(stripped).toBe(1)
    expect(body.includes('[[')).toBe(false)
  })

  it('leaves real markdown links untouched', () => {
    const input = 'see [SEO](/blog/seo/estrategia-seo) now'
    expect(sanitizeWikilinks(input).body).toBe(input)
  })

  it('does NOT touch Python 2D-array code that looks like brackets', () => {
    const code = 'dp = [[0 for _ in range(c + 1)] for _ in range(n + 1)]'
    const { body, stripped } = sanitizeWikilinks(code)
    expect(body).toBe(code)
    expect(stripped).toBe(0)
  })

  it('guarantees no [[ remains for slug-shaped wikilinks', () => {
    const { body } = sanitizeWikilinks('a [[a-b|X]] b [[c-d]] c')
    expect(body.includes('[[')).toBe(false)
  })

  it('handles multiple wikilinks and reports the count', () => {
    const { stripped } = sanitizeWikilinks('[[a|A]] [[b|B]] [[c|C]]')
    expect(stripped).toBe(3)
  })
})
