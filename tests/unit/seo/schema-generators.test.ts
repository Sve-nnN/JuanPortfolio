import { describe, it, expect } from 'vitest'

const SITE = 'https://juan-tech.com'
// Set before importing the generators: generateSchema reads this env at call
// time and describe bodies execute during test collection.
process.env.NEXT_PUBLIC_SERVER_URL = SITE

const { generateSchema } = await import('@/utilities/generateSchema')
const { generateWebSiteSchema } = await import('@/utilities/schema/generateWebSiteSchema')
const { generateOrganizationSchema } = await import(
  '@/utilities/schema/generateOrganizationSchema'
)
const { generateCollectionPageSchema } = await import(
  '@/utilities/schema/generateCollectionPageSchema'
)
const { generatePersonSchema } = await import('@/utilities/schema/generatePersonSchema')
const { generateWebPageSchema } = await import('@/utilities/schema/generateWebPageSchema')

/**
 * Regression suite for the SEO audit (jun-2026) schema fixes:
 * #18 double-nested @graph, #19 BlogPosting image, #25 author URL,
 * #26 SearchAction absolute URL, #27 Organization logo.
 */
describe('generateSchema — BlogPosting (issues #19, #25)', () => {
  const post = generateSchema({
    collection: 'posts',
    url: `${SITE}/blog/tech-seo/example`,
    doc: {
      slug: 'example',
      title: 'Example Post',
      publishedAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-02-01T00:00:00.000Z',
      meta: {},
    } as never,
  }) as Record<string, unknown>

  it('always emits an absolute image even without a meta image (#19)', () => {
    expect(post.image).toBeTruthy()
    expect(String(post.image)).toMatch(/^https?:\/\//)
  })

  it('uses the canonical plural /authors/ author URL (#25)', () => {
    const author = post.author as { url?: string }
    expect(author?.url).toBe(`${SITE}/authors/juan-carlos-angulo`)
    expect(author?.url).not.toContain('/author/juan')
  })
})

describe('generateSchema — @graph flattening (issue #18)', () => {
  it('wraps mainEntity + breadcrumbs in a single, non-nested @graph', () => {
    const schema = generateSchema({
      collection: 'posts',
      url: `${SITE}/blog/tech-seo/example`,
      doc: { slug: 'example', title: 'Example', meta: {} } as never,
      breadcrumbs: [
        { name: 'Home', url: SITE },
        { name: 'Blog', url: `${SITE}/blog` },
      ],
    }) as { '@graph'?: unknown[] }

    expect(Array.isArray(schema['@graph'])).toBe(true)
    // No graph item may itself be a graph container (the old double-nesting bug).
    for (const node of schema['@graph'] as Array<Record<string, unknown>>) {
      expect(node['@graph']).toBeUndefined()
    }
  })
})

describe('generateWebSiteSchema — SearchAction (issue #26)', () => {
  it('emits an absolute urlTemplate from a relative searchUrl', () => {
    const schema = generateWebSiteSchema('Juan Tech', SITE, '/search') as {
      potentialAction?: { target?: { urlTemplate?: string } }
    }
    const tpl = schema.potentialAction?.target?.urlTemplate
    expect(tpl).toBe(`${SITE}/search?q={search_term_string}`)
    expect(tpl?.startsWith('/')).toBe(false)
  })

  it('leaves an already-absolute searchUrl untouched', () => {
    const schema = generateWebSiteSchema('Juan Tech', SITE, `${SITE}/buscar`) as {
      potentialAction?: { target?: { urlTemplate?: string } }
    }
    expect(schema.potentialAction?.target?.urlTemplate).toBe(
      `${SITE}/buscar?q={search_term_string}`,
    )
  })
})

describe('generateOrganizationSchema — logo fallback (issue #27)', () => {
  it('falls back to /logo.png when no logo is configured', () => {
    const schema = generateOrganizationSchema({ name: 'Juan Tech', url: SITE }) as {
      logo?: string
    }
    expect(schema.logo).toBe(`${SITE}/logo.png`)
  })

  it('respects an explicit absolute logo', () => {
    const schema = generateOrganizationSchema({
      name: 'Juan Tech',
      url: SITE,
      logo: 'https://cdn.example.com/logo.svg',
    }) as { logo?: string }
    expect(schema.logo).toBe('https://cdn.example.com/logo.svg')
  })
})

describe('generateCollectionPageSchema — optional count (issue #29)', () => {
  it('omits numberOfItems when not provided (index pages have no count)', () => {
    const s = generateCollectionPageSchema({ name: 'Blog', url: '/blog' }) as Record<string, unknown>
    expect(s['@type']).toBe('CollectionPage')
    expect(s.url).toBe(`${SITE}/blog`)
    expect('numberOfItems' in s).toBe(false)
  })

  it('includes numberOfItems when provided', () => {
    const s = generateCollectionPageSchema({ name: 'Authors', url: '/authors', numberOfItems: 3 }) as Record<string, unknown>
    expect(s.numberOfItems).toBe(3)
  })
})


describe('generateWebPageSchema (issue #48)', () => {
  it('emits a WebPage linked to #website and #organization', () => {
    const s = generateWebPageSchema({ name: 'Privacy', url: '/privacy' }) as Record<string, any>
    expect(s['@type']).toBe('WebPage')
    expect(s['@id']).toBe(`${SITE}/privacy`)
    expect(s.isPartOf['@id']).toBe(`${SITE}/#website`)
    expect(s.publisher['@id']).toBe(`${SITE}/#organization`)
  })
  it('honors a subtype like ContactPage', () => {
    const s = generateWebPageSchema({ type: 'ContactPage', name: 'Contact', url: '/contact' }) as Record<string, any>
    expect(s['@type']).toBe('ContactPage')
  })
})

describe('generatePersonSchema alumniOf degree (issue #50)', () => {
  const s = generatePersonSchema({
    name: 'Juan', url: SITE,
    alumniOf: [{ name: 'Some University', url: 'https://u.edu', degree: 'BSc Computer Science' }],
  }) as Record<string, any>
  it('keeps alumniOf as EducationalOrganization', () => {
    expect(s.alumniOf[0]['@type']).toBe('EducationalOrganization')
    expect(s.alumniOf[0].name).toBe('Some University')
  })
  it('surfaces the degree as a hasCredential (no longer dropped)', () => {
    const cred = (s.hasCredential || []).find((c: any) => c.name === 'BSc Computer Science')
    expect(cred).toBeTruthy()
    expect(cred.credentialCategory).toBe('degree')
    expect(cred.recognizedBy.name).toBe('Some University')
  })
})

describe('generateSchema publisher (issue #49)', () => {
  it('does not emit a dangling #person founder on posts', () => {
    const post = generateSchema({
      collection: 'posts', url: `${SITE}/blog/x/y`,
      doc: { slug: 'y', title: 'Y', meta: {} } as never,
    }) as Record<string, any>
    expect(post.publisher?.founder).toBeUndefined()
  })
})
