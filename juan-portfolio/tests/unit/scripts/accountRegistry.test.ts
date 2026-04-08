import { beforeEach, describe, expect, it, vi } from 'vitest'

const { existsSyncMock, readFileSyncMock, writeFileSyncMock } = vi.hoisted(() => ({
  existsSyncMock: vi.fn(),
  readFileSyncMock: vi.fn(),
  writeFileSyncMock: vi.fn(),
}))

vi.mock('fs', () => {
  const mod = {
    existsSync: existsSyncMock,
    readFileSync: readFileSyncMock,
    writeFileSync: writeFileSyncMock,
  }
  return { ...mod, default: mod }
})

import { loadRegistry, registerAccount, updateAccount } from '../../../src/scripts/utils/accountRegistry'

beforeEach(() => {
  vi.clearAllMocks()
  existsSyncMock.mockReturnValue(true)
  readFileSyncMock.mockReturnValue('[]')
})

describe('registerAccount', () => {
  it('creates entry with base fields only when no profile', () => {
    registerAccount('juan@example.com', 'Secret123!')
    expect(writeFileSyncMock).toHaveBeenCalled()
    const payload = JSON.parse(String(writeFileSyncMock.mock.calls.at(-1)?.[1] ?? '[]'))
    expect(payload[0]).toMatchObject({
      email: 'juan@example.com',
      password: 'Secret123!',
      kwCredits: 150,
      contentCredits: 5,
    })
    expect(payload[0]).not.toHaveProperty('createdLanguage')
  })

  it('creates entry with profile fields when profile provided', () => {
    registerAccount('juan@example.com', 'Secret123!', {
      language: 'en',
      country: 'US',
      domain: 'example.com',
      projectType: 'ecommerce',
      clientId: 'c1',
    })
    const payload = JSON.parse(String(writeFileSyncMock.mock.calls.at(-1)?.[1] ?? '[]'))
    expect(payload[0]).toMatchObject({
      createdLanguage: 'en',
      createdCountry: 'US',
      createdDomain: 'example.com',
      createdProjectType: 'ecommerce',
      assignedClientId: 'c1',
    })
  })
})

describe('updateAccount', () => {
  it('persists cooldownUntil field', () => {
    readFileSyncMock.mockReturnValue(JSON.stringify([
      {
        email: 'juan@example.com',
        password: 'Secret123!',
        keywords: [],
        content: [],
        kwCredits: 150,
        contentCredits: 5,
        createdAt: '2026-04-01T00:00:00.000Z',
        expiresAt: '2026-04-08T00:00:00.000Z',
        lastUsed: '2026-04-01T00:00:00.000Z',
      },
    ]))
    updateAccount('juan@example.com', { cooldownUntil: '2026-04-01T12:00:00.000Z' })
    const payload = JSON.parse(String(writeFileSyncMock.mock.calls.at(-1)?.[1] ?? '[]'))
    expect(payload[0].cooldownUntil).toBe('2026-04-01T12:00:00.000Z')
  })
})

describe('loadRegistry', () => {
  it('returns entries missing new fields without error', () => {
    readFileSyncMock.mockReturnValue(JSON.stringify([
      {
        email: 'juan@example.com',
        password: 'Secret123!',
        keywords: [],
        content: [],
        kwCredits: 150,
        contentCredits: 5,
        createdAt: '2026-04-01T00:00:00.000Z',
        expiresAt: '2026-04-08T00:00:00.000Z',
        lastUsed: '2026-04-01T00:00:00.000Z',
      },
    ]))
    expect(() => loadRegistry()).not.toThrow()
    expect(loadRegistry()).toHaveLength(1)
  })

  it('filters expired accounts', () => {
    readFileSyncMock.mockReturnValue(JSON.stringify([
      {
        email: 'expired@example.com',
        password: 'Secret123!',
        keywords: [],
        content: [],
        kwCredits: 150,
        contentCredits: 5,
        createdAt: '2026-04-01T00:00:00.000Z',
        expiresAt: '2020-04-08T00:00:00.000Z',
        lastUsed: '2026-04-01T00:00:00.000Z',
      },
    ]))
    expect(loadRegistry()).toHaveLength(0)
  })

  it('filters kwCredits -1 accounts', () => {
    readFileSyncMock.mockReturnValue(JSON.stringify([
      {
        email: 'bad@example.com',
        password: 'Secret123!',
        keywords: [],
        content: [],
        kwCredits: -1,
        contentCredits: 5,
        createdAt: '2026-04-01T00:00:00.000Z',
        expiresAt: '2026-04-08T00:00:00.000Z',
        lastUsed: '2026-04-01T00:00:00.000Z',
      },
    ]))
    expect(loadRegistry()).toHaveLength(0)
  })
})
