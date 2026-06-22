import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'

/**
 * Regression suite for the SEO audit (jun-2026) issue #32: the default locale
 * (es) is served prefix-less at the root, so any /es-prefixed URL is a duplicate
 * and must 301 to its prefix-less canonical.
 */
function run(path: string) {
  return middleware(new NextRequest(`https://juan-tech.com${path}`))
}

describe('middleware /es duplicate redirect (issue #32)', () => {
  it('301-redirects /es to /', () => {
    const res = run('/es')
    expect(res.status).toBe(301)
    expect(new URL(res.headers.get('location')!).pathname).toBe('/')
  })

  it('301-redirects /es/blog to /blog', () => {
    const res = run('/es/blog')
    expect(res.status).toBe(301)
    expect(new URL(res.headers.get('location')!).pathname).toBe('/blog')
  })

  it('preserves the query string on redirect', () => {
    const res = run('/es/search?q=seo')
    expect(res.status).toBe(301)
    const loc = new URL(res.headers.get('location')!)
    expect(loc.pathname).toBe('/search')
    expect(loc.search).toBe('?q=seo')
  })

  it('does NOT redirect the /en locale', () => {
    const res = run('/en/blog')
    expect(res.status).not.toBe(301)
  })

  it('does NOT redirect the prefix-less root', () => {
    const res = run('/')
    expect(res.status).not.toBe(301)
  })

  it('does NOT redirect a prefix-less content path', () => {
    const res = run('/blog')
    expect(res.status).not.toBe(301)
  })
})
