import { describe, it, expect } from 'vitest'

const SITE = 'https://juan-tech.com'
process.env.NEXT_PUBLIC_SERVER_URL = SITE

const { generateMeta } = await import('@/utilities/generateMeta')

/**
 * Regression suite for the SEO audit (jun-2026) issue #14: the /authors and
 * /case-studies listing templates lacked generateMetadata and inherited the
 * root layout's homepage canonical. These assert the listing metadata is
 * self-referential per locale (never the homepage).
 */
describe.each([
  ['/authors', { title: 'Authors | Juan Tech', meta: { description: 'd' } }],
  ['/case-studies', { title: 'Case studies | Juan Tech', meta: { description: 'd' } }],
])('listing metadata for %s (issue #14)', (path, doc) => {
  it('emits a self-referential canonical for es (default, no prefix)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = await generateMeta({ doc: doc as any, locale: 'es', path })
    const canonical = meta.alternates?.canonical as string
    expect(canonical).toBe(`${SITE}${path}`)
    expect(canonical).not.toBe(SITE)
    expect(canonical).not.toBe(`${SITE}/`)
  })

  it('emits a self-referential canonical for en (/en prefix)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = await generateMeta({ doc: doc as any, locale: 'en', path })
    const canonical = meta.alternates?.canonical as string
    expect(canonical).toBe(`${SITE}/en${path}`)
  })

  it('declares es/en/x-default hreflang alternates', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = await generateMeta({ doc: doc as any, locale: 'es', path })
    const langs = meta.alternates?.languages as Record<string, string>
    expect(langs?.es).toBe(`${SITE}${path}`)
    expect(langs?.en).toBe(`${SITE}/en${path}`)
    expect(langs?.['x-default']).toBe(`${SITE}${path}`)
  })
})
