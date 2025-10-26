import { test, expect } from '@playwright/test'
import { MongoClient } from 'mongodb'

const BASE = 'http://localhost:3000'

test.describe('Frontend routes (isolated)', () => {
  let client: MongoClient
  let db: ReturnType<MongoClient['db']>
  const postSlug = 'e2e-temp-post'
  const csSlug = 'e2e-temp-case-study'

  test.beforeAll(async () => {
    const uri = process.env.DATABASE_URI
    if (!uri) throw new Error('DATABASE_URI must be set for e2e tests')
    client = new MongoClient(uri as string)
    await client.connect()
    db = client.db()

    // create minimal post in `posts` collection
    const now = new Date().toISOString()
    await db.collection('posts').insertOne({
      title: 'E2E Temp Post',
      slug: postSlug,
      _status: 'published',
      content: {
        root: { type: 'root', children: [{ type: 'paragraph', children: [{ text: 'temp' }] }] },
      },
      createdAt: now,
      updatedAt: now,
    })

    // create minimal case-study in `case-studies` collection
    await db.collection('case-studies').insertOne({
      title: 'E2E Temp CaseStudy',
      slug: csSlug,
      _status: 'published',
      excerpt: 'temp',
      createdAt: now,
      updatedAt: now,
    })
  })

  test.afterAll(async () => {
    if (db) {
      await db.collection('posts').deleteMany({ slug: postSlug })
      await db.collection('case-studies').deleteMany({ slug: csSlug })
    }
    if (client) await client.close()
  })

  test('homepage loads', async ({ page }) => {
    await page.goto(BASE)
    await expect(page).toHaveTitle(/Payload Website Template/)
  })

  test('blog post page loads (created in beforeAll)', async ({ page }) => {
    await page.goto(`${BASE}/blog/${postSlug}`)
    await expect(page).toHaveURL(new RegExp(`blog\\/${postSlug}`))
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
  })

  test('case study page loads (created in beforeAll)', async ({ page }) => {
    await page.goto(`${BASE}/case-studies/${csSlug}`)
    await expect(page).toHaveURL(new RegExp(`case-studies\\/${csSlug}`))
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
  })
})
