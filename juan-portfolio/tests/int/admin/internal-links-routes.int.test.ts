/**
 * Integration tests for:
 *   GET  /api/internal-links
 *   POST /api/internal-links/apply
 *
 * Route handlers are imported directly and called with mock Request objects.
 * Payload auth is mocked to return an authenticated user.
 * CONTENT_DIR env var is set to a temporary directory with fixture posts.
 */

import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'

// ─── Hoist spawnSync mock so it works with ESM ───────────────────────────────

const { mockSpawnSync } = vi.hoisted(() => ({
  mockSpawnSync: vi.fn().mockReturnValue({
    status: 0,
    stdout: 'synced',
    stderr: '',
    pid: 0,
    output: [],
    signal: null,
  }),
}))

// ─── Mock dependencies before route imports ───────────────────────────────────

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({
    auth: vi.fn().mockResolvedValue({ user: { id: '1', email: 'test@test.com' } }),
  }),
}))

vi.mock('@payload-config', () => ({ default: {} }))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>()
  return {
    ...actual,
    spawnSync: mockSpawnSync,
  }
})

// ─── Import route handlers after mocks ────────────────────────────────────────
import { GET } from '@/app/api/internal-links/route'
import { POST } from '@/app/api/internal-links/apply/route'

// ─── Fixture content ─────────────────────────────────────────────────────────

let tmpDir: string

const SOURCE_POST_SLUG = 'source-post'
const TARGET_POST_SLUG = 'target-post'

const SOURCE_POST_CONTENT = `---
title: Source Post
slug: ${SOURCE_POST_SLUG}
primary_keywords:
  - source keyword
idioma: es
contentRole: satellite
---

Este artículo habla sobre big-o notation y complejidad algorítmica.
El big-o es fundamental para entender algoritmos eficientes.
También discutimos estructuras de datos y su importancia.
`

const TARGET_POST_CONTENT = `---
title: Target Post about big-o
slug: ${TARGET_POST_SLUG}
primary_keywords:
  - big-o
  - big-o notation
idioma: es
contentRole: pillar
---

Esta es la guía completa sobre big-o notation.
Aprenderás todo sobre la notación big-o y su aplicación práctica.
`

const TARGET_EN_CONTENT = `---
title: English Target Post
slug: target-en
primary_keywords:
  - big-o
idioma: en
contentRole: satellite
---

This is an English post about big-o notation.
`

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'il-routes-test-'))
  const postsDir = path.join(tmpDir, 'content', 'posts', 'tech')
  fs.mkdirSync(postsDir, { recursive: true })

  fs.writeFileSync(path.join(postsDir, `${SOURCE_POST_SLUG}.md`), SOURCE_POST_CONTENT)
  fs.writeFileSync(path.join(postsDir, `${TARGET_POST_SLUG}.md`), TARGET_POST_CONTENT)
  fs.writeFileSync(path.join(postsDir, 'target-en.en.md'), TARGET_EN_CONTENT)

  // Set CONTENT_DIR to point to our tmp content directory
  process.env.CONTENT_DIR = path.join(tmpDir, 'content')
})

afterAll(() => {
  delete process.env.CONTENT_DIR
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

// ─── GET /api/internal-links tests ────────────────────────────────────────────

describe('GET /api/internal-links', () => {
  it('returns 400 when slug is missing', async () => {
    const req = new Request('http://localhost/api/internal-links')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/slug/i)
  })

  it('returns empty suggestions for unknown slug', async () => {
    const req = new Request('http://localhost/api/internal-links?slug=nonexistent-post-xyz')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.suggestions).toEqual([])
    expect(body.slug).toBe('nonexistent-post-xyz')
  })

  it('returns 200 with suggestions array for valid slug', async () => {
    const req = new Request(
      `http://localhost/api/internal-links?slug=${SOURCE_POST_SLUG}`,
    )
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('slug', SOURCE_POST_SLUG)
    expect(body).toHaveProperty('locale', 'es')
    expect(Array.isArray(body.suggestions)).toBe(true)
  })

  it('returns locale-scoped suggestions only (no EN targets for ES source)', async () => {
    const req = new Request(
      `http://localhost/api/internal-links?slug=${SOURCE_POST_SLUG}`,
    )
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    // Should not include the English post as a target
    for (const s of body.suggestions) {
      expect(s.targetSlug).not.toBe('target-en')
    }
  })

  it('returned suggestions have required fields', async () => {
    const req = new Request(
      `http://localhost/api/internal-links?slug=${SOURCE_POST_SLUG}`,
    )
    const res = await GET(req)
    const body = await res.json()
    for (const s of body.suggestions) {
      expect(s).toHaveProperty('sourceSlug')
      expect(s).toHaveProperty('targetSlug')
      expect(s).toHaveProperty('targetTitle')
      expect(s).toHaveProperty('targetUrl')
      expect(s).toHaveProperty('keyword')
      expect(s).toHaveProperty('lineNumber')
      expect(s).toHaveProperty('confidence')
      expect(s).toHaveProperty('filePath')
    }
  })
})

// ─── POST /api/internal-links/apply tests ─────────────────────────────────────

describe('POST /api/internal-links/apply', () => {
  it('returns 400 when body fields are missing', async () => {
    const req = new Request('http://localhost/api/internal-links/apply', {
      method: 'POST',
      body: JSON.stringify({ sourceSlug: SOURCE_POST_SLUG }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/missing/i)
  })

  it('returns 403 for path traversal attempt', async () => {
    const req = new Request('http://localhost/api/internal-links/apply', {
      method: 'POST',
      body: JSON.stringify({
        sourceSlug: SOURCE_POST_SLUG,
        filePath: '/etc/passwd',
        keyword: 'big-o',
        targetUrl: 'https://juan-tech.com/tech/target-post',
        lineNumber: 1,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/invalid file path/i)
  })

  it('returns 400 when file does not exist', async () => {
    const req = new Request('http://localhost/api/internal-links/apply', {
      method: 'POST',
      body: JSON.stringify({
        sourceSlug: SOURCE_POST_SLUG,
        filePath: path.join(tmpDir, 'content/posts/tech/nonexistent.md'),
        keyword: 'big-o',
        targetUrl: 'https://juan-tech.com/tech/target-post',
        lineNumber: 1,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/not found/i)
  })

  it('writes the link to the markdown file on success', async () => {
    // Create a copy of the source post to modify
    const testFile = path.join(tmpDir, 'content/posts/tech/apply-test.md')
    fs.copyFileSync(
      path.join(tmpDir, 'content/posts/tech/source-post.md'),
      testFile,
    )

    // Find the line number in the body (1-based) that contains 'big-o'
    const content = fs.readFileSync(testFile, 'utf-8')
    const allLines = content.split('\n')
    const bodyStartIdx = allLines.findIndex((l, i) => i > 0 && l.trim() === '---') + 1
    const relativeLineIdx = allLines.slice(bodyStartIdx).findIndex((l) => l.includes('big-o'))
    const lineNumber = relativeLineIdx + 1 // 1-based body line

    mockSpawnSync.mockReturnValueOnce({
      status: 0, stdout: 'synced', stderr: '', pid: 0, output: [], signal: null,
    })

    const req = new Request('http://localhost/api/internal-links/apply', {
      method: 'POST',
      body: JSON.stringify({
        sourceSlug: SOURCE_POST_SLUG,
        filePath: testFile,
        keyword: 'big-o',
        targetUrl: 'https://juan-tech.com/tech/target-post',
        lineNumber,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.message).toMatch(/applied/i)

    const written = fs.readFileSync(testFile, 'utf-8')
    expect(written).toContain('[big-o](https://juan-tech.com/tech/target-post)')
  })

  it('returns success:false when spawnSync fails', async () => {
    mockSpawnSync.mockReturnValueOnce({
      status: 1,
      stdout: '',
      stderr: 'sync error',
      pid: 0,
      output: [],
      signal: null,
    })

    const testFile2 = path.join(tmpDir, 'content/posts/tech/apply-test2.md')
    fs.copyFileSync(
      path.join(tmpDir, 'content/posts/tech/source-post.md'),
      testFile2,
    )

    const content = fs.readFileSync(testFile2, 'utf-8')
    const allLines = content.split('\n')
    const bodyStartIdx = allLines.findIndex((l, i) => i > 0 && l.trim() === '---') + 1
    const relativeLineIdx = allLines.slice(bodyStartIdx).findIndex((l) => l.includes('big-o'))
    const lineNumber = relativeLineIdx + 1

    const req = new Request('http://localhost/api/internal-links/apply', {
      method: 'POST',
      body: JSON.stringify({
        sourceSlug: SOURCE_POST_SLUG,
        filePath: testFile2,
        keyword: 'big-o',
        targetUrl: 'https://juan-tech.com/tech/target-post',
        lineNumber,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.message).toMatch(/sync failed/i)
  })
})
