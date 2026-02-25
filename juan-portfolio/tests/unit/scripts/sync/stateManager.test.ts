import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { loadState, saveState, calculateHash, getAllMdFiles } from '../../../../src/scripts/sync/stateManager'
import type { SyncState } from '../../../../src/scripts/sync/types'

const tmpDir = path.join(os.tmpdir(), 'sync-state-test-' + Date.now())
const stateFile = path.join(tmpDir, 'sync-state.json')

beforeEach(() => {
  fs.mkdirSync(tmpDir, { recursive: true })
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('calculateHash', () => {
  it('returns a deterministic SHA-256 hex string', () => {
    const hash = calculateHash('hello world')
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]+$/)
  })

  it('returns the same hash for identical content', () => {
    expect(calculateHash('same')).toBe(calculateHash('same'))
  })

  it('returns different hashes for different content', () => {
    expect(calculateHash('a')).not.toBe(calculateHash('b'))
  })
})

describe('loadState', () => {
  it('returns empty state when the file does not exist', () => {
    const state = loadState('/non/existent/path.json')
    expect(state).toEqual({ files: {} })
  })

  it('reads an existing state file', () => {
    const data: SyncState = {
      files: {
        'post.md': {
          id: 'abc123',
          slug: 'my-post',
          locale: 'es',
          lastLocalHash: 'hash',
          lastRemoteUpdatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    }
    fs.writeFileSync(stateFile, JSON.stringify(data))
    const state = loadState(stateFile)
    expect(state.files['post.md'].id).toBe('abc123')
    expect(state.files['post.md'].locale).toBe('es')
  })

  it('migrates legacy "idioma" field to "locale" transparently', () => {
    const legacyData = {
      files: {
        'post.md': {
          id: 'legacy-id',
          slug: 'post',
          idioma: 'es',
          lastLocalHash: 'hash',
          lastRemoteUpdatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    }
    fs.writeFileSync(stateFile, JSON.stringify(legacyData))
    const state = loadState(stateFile)
    expect(state.files['post.md'].locale).toBe('es')
  })
})

describe('saveState', () => {
  it('persists state to disk and can be reloaded', () => {
    const state: SyncState = {
      files: {
        'new-post.en.md': {
          id: 'xyz',
          slug: 'new-post',
          locale: 'en',
          lastLocalHash: 'deadbeef',
          lastRemoteUpdatedAt: '2026-02-01T00:00:00.000Z',
        },
      },
    }
    saveState(stateFile, state)
    const reloaded = loadState(stateFile)
    expect(reloaded.files['new-post.en.md'].locale).toBe('en')
    expect(reloaded.files['new-post.en.md'].id).toBe('xyz')
  })
})

describe('getAllMdFiles', () => {
  it('returns all .md files recursively', () => {
    fs.writeFileSync(path.join(tmpDir, 'post.md'), '')
    fs.writeFileSync(path.join(tmpDir, 'post.en.md'), '')
    const subdir = path.join(tmpDir, 'sub')
    fs.mkdirSync(subdir)
    fs.writeFileSync(path.join(subdir, 'nested.md'), '')

    const files = getAllMdFiles(tmpDir)
    expect(files).toHaveLength(3)
    expect(files.some(f => f.endsWith('post.md'))).toBe(true)
    expect(files.some(f => f.endsWith('post.en.md'))).toBe(true)
    expect(files.some(f => f.endsWith('nested.md'))).toBe(true)
  })

  it('ignores non-md files', () => {
    fs.writeFileSync(path.join(tmpDir, 'state.json'), '{}')
    fs.writeFileSync(path.join(tmpDir, 'post.md'), '')
    const files = getAllMdFiles(tmpDir)
    expect(files).toHaveLength(1)
  })

  it('returns an empty array for an empty directory', () => {
    expect(getAllMdFiles(tmpDir)).toHaveLength(0)
  })
})
