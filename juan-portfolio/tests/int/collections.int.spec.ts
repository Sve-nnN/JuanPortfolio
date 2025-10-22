import { describe, it, beforeAll, expect } from 'vitest'
import { getPayload, Payload } from 'payload'
import { createWithRetries, deleteIfExists } from './helpers/createWithRetries'
import config from '@/payload.config'

let payload: Payload

describe('Collections integration', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('can create and fetch a user with slug', async () => {
    const created = await createWithRetries(payload, {
      collection: 'users',
      // tests intentionally cast to any to avoid payload-types strict checks
      data: { name: 'Test User', email: `test-user+${Date.now()}@example.com`, password: 'password' } as any,
    })
    expect(created).toBeDefined()
    expect(created.slug).toBeDefined()

    const found = await payload.find({ collection: 'users', where: { slug: { equals: created.slug } }, limit: 1 })
    expect(found.totalDocs).toBeGreaterThan(0)
  }, 20000)

  it('can create and fetch a category', async () => {
  const cat = await createWithRetries(payload, { collection: 'categories', data: { title: 'Integration Cat', slug: `integration-cat-${Date.now()}` } as any })
    expect(cat).toBeDefined()

  const found = await payload.find({ collection: 'categories', where: { title: { equals: 'Integration Cat' } }, limit: 1 })
    expect(found.totalDocs).toBeGreaterThan(0)
  })

  it('can create a case-study and a post and fetch them', async () => {
  const cs = await createWithRetries(payload, { collection: 'case-studies', data: { title: 'CS Integration', slug: `cs-integration-${Date.now()}` } as any })
    expect(cs).toBeDefined()

    const post = await createWithRetries(payload, {
      collection: 'posts',
      data: {
        title: 'Post Integration',
        slug: `post-integration-${Date.now()}`,
        content: { root: { type: 'root', version: 1, children: [{ type: 'paragraph', children: [{ text: 'Integration post content' }] }] } } as any,
      },
    })
    expect(post).toBeDefined()

    const csFound = await payload.find({ collection: 'case-studies', where: { title: { equals: 'CS Integration' } }, limit: 1 })
    expect(csFound.totalDocs).toBeGreaterThan(0)

    const postFound = await payload.find({ collection: 'posts', where: { title: { equals: 'Post Integration' } }, limit: 1 })
    expect(postFound.totalDocs).toBeGreaterThan(0)
  })

  it('can create and fetch a page', async () => {
  const page = await createWithRetries(payload, { collection: 'pages', data: { title: 'Integration Page', slug: `integration-page-${Date.now()}`, hero: { type: 'lowImpact' }, layout: [ { blockType: 'content', columns: [ { size: 'full', richText: { root: { type: 'root', version: 1, children: [{ type: 'paragraph', children: [{ text: 'Integration page content' }] }] } } } ] } ] } as any })
    expect(page).toBeDefined()

  const found = await payload.find({ collection: 'pages', where: { title: { equals: 'Integration Page' } }, limit: 1 })
    expect(found.totalDocs).toBeGreaterThan(0)
  })
})
