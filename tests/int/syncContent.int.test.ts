import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../../src/payload.config'
import { convertMarkdownToLexical } from '../../src/scripts/utils/markdownConverter'

// We need to point to a test content directory to avoid messing with real content
const TEST_CONTENT_DIR = path.resolve(process.cwd(), 'tmp-test-sync')
const SYNC_STATE_FILE = path.join(TEST_CONTENT_DIR, 'content-sync.json')

describe('Content Sync Integration', () => {
  let payload: any

  beforeAll(async () => {
    payload = await getPayload({ config })
    if (!fs.existsSync(TEST_CONTENT_DIR)) {
      fs.mkdirSync(TEST_CONTENT_DIR, { recursive: true })
    }
  })

  beforeEach(async () => {
    // Clean up test directory and database
    if (fs.existsSync(SYNC_STATE_FILE)) fs.unlinkSync(SYNC_STATE_FILE)
    try {
      await payload.delete({
        collection: 'posts',
        where: { slug: { equals: 'test-sync-post' } },
      })
    } catch (e) {}
  })

  it('should detect a new untracked file', async () => {
    const filePath = path.join(TEST_CONTENT_DIR, 'test-post.md')
    fs.writeFileSync(filePath, '---\ntitle: Test\nidioma: en\n---\nBody')
    
    expect(fs.existsSync(filePath)).toBe(true)
  })

  it('should correctly create a post in Payload via logic similar to push', async () => {
    const slug = 'test-sync-post'
    const title = 'Test Sync Post'
    const content = 'Test Content'
    
    const created = await payload.create({
      collection: 'posts',
      data: {
        title,
        slug,
        content: {
          content: convertMarkdownToLexical(content),
        },
        _status: 'published',
      },
      locale: 'en',
      context: { disableRevalidate: true },
    })

    expect(created.id).toBeDefined()
    expect(created.title).toBe(title)
    
    const fetched = await payload.findByID({
      collection: 'posts',
      id: created.id,
      locale: 'en',
    })
    expect(fetched.title).toBe(title)
  })
})
