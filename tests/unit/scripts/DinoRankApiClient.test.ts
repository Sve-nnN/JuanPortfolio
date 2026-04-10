import { beforeEach, describe, expect, it, vi } from 'vitest'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { readFileSync, writeFileSync } from 'fs'

const fetchMock = vi.fn()

vi.stubGlobal('fetch', fetchMock)

import { DinoRankApiClient } from '../../../src/scripts/dinorank/DinoRankApiClient'

function makeResponse(body: string, init: Partial<Response> = {}): Response {
  return {
    ok: true,
    status: 200,
    text: vi.fn().mockResolvedValue(body),
    headers: new Headers(),
    ...init,
  } as Response
}

function sessionPath(): string {
  return join(tmpdir(), `dinorank-session-${randomUUID()}.json`)
}

beforeEach(() => {
  fetchMock.mockReset()
})

describe('login', () => {
  it('returns ok when the login response is active', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse('login page'))
      .mockResolvedValueOnce(makeResponse('{"status":"activo"}'))
      .mockResolvedValueOnce(makeResponse('homed page'))
      .mockResolvedValueOnce(makeResponse('keyword-research page'))

    const client = new DinoRankApiClient('juan@example.com', 'Secret123!', sessionPath())
    await expect(client.login('es')).resolves.toBe('ok')
  })

  it('returns device_conflict when the response mentions dispositivo', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse('login page'))
      .mockResolvedValueOnce(makeResponse('dispositivo en uso'))

    const client = new DinoRankApiClient('juan@example.com', 'Secret123!', sessionPath())
    await expect(client.login('es')).resolves.toBe('device_conflict')
  })

  it('returns device_conflict when the response mentions device', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse('login page'))
      .mockResolvedValueOnce(makeResponse('device conflict'))

    const client = new DinoRankApiClient('juan@example.com', 'Secret123!', sessionPath())
    await expect(client.login('es')).resolves.toBe('device_conflict')
  })

  it('returns failed for other responses', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse('login page'))
      .mockResolvedValueOnce(makeResponse('unexpected response'))

    const client = new DinoRankApiClient('juan@example.com', 'Secret123!', sessionPath())
    await expect(client.login('es')).resolves.toBe('failed')
  })

  it('uses en URLs when language is en', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse('login page'))
      .mockResolvedValueOnce(makeResponse('{"status":"activo"}'))
      .mockResolvedValueOnce(makeResponse('homed page'))
      .mockResolvedValueOnce(makeResponse('keyword-research page'))

    const client = new DinoRankApiClient('juan@example.com', 'Secret123!', sessionPath())
    await client.login('en')

    expect(fetchMock).toHaveBeenCalledWith('https://dinorank.com/en/login/', expect.any(Object))
    expect(fetchMock).toHaveBeenCalledWith(
      'https://dinorank.com/ajax/login.php',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('permanecer=si'),
      }),
    )
    expect(fetchMock).toHaveBeenCalledWith('https://dinorank.com/en/homed/', expect.any(Object))
  })

  it('uses permanecer=si in the login body', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse('login page'))
      .mockResolvedValueOnce(makeResponse('{"status":"activo"}'))
      .mockResolvedValueOnce(makeResponse('homed page'))
      .mockResolvedValueOnce(makeResponse('keyword-research page'))

    const client = new DinoRankApiClient('juan@example.com', 'Secret123!', sessionPath())
    await client.login('es')

    const loginCall = fetchMock.mock.calls.find(call => call[0] === 'https://dinorank.com/ajax/login.php')
    expect(String(loginCall?.[1]?.body ?? '')).toContain('permanecer=si')
  })
})

describe('logout', () => {
  it('posts to cierra.php when cookies exist', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse('login page', {
        headers: new Headers({ 'set-cookie': 'PHPSESSID=abc123; Path=/, csrf_token=tok123; Path=/' }),
      }))
      .mockResolvedValueOnce(makeResponse('{"status":"activo"}', {
        headers: new Headers({ 'set-cookie': 'logged_in=1; Path=/' }),
      }))
      .mockResolvedValueOnce(makeResponse('homed page'))
      .mockResolvedValueOnce(makeResponse('keyword-research page'))
      .mockResolvedValueOnce(makeResponse('logout ok'))

    const client = new DinoRankApiClient('juan@example.com', 'Secret123!', sessionPath())
    await client.login('es')
    await client.logout()

    expect(fetchMock).toHaveBeenCalledWith('https://dinorank.com/ajax/cierra.php', expect.objectContaining({ method: 'POST' }))
  })

  it('is a no-op when no cookies are set', async () => {
    const client = new DinoRankApiClient('juan@example.com', 'Secret123!', sessionPath())
    await expect(client.logout()).resolves.toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('clears only the current account from the session file', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse('login page'))
      .mockResolvedValueOnce(makeResponse('{"status":"activo"}'))
      .mockResolvedValueOnce(makeResponse('homed page'))
      .mockResolvedValueOnce(makeResponse('keyword-research page'))
      .mockResolvedValueOnce(makeResponse('logout ok'))

    const client = new DinoRankApiClient('juan@example.com', 'Secret123!', sessionPath())
    await client.login('es')
    await client.logout()

    expect(client.getCookieHeader()).toBe('')
  })
})

describe('get/post', () => {
  it('get returns response text and merges cookies', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse('hello', {
      headers: new Headers({ 'set-cookie': 'a=1; Path=/, b=2; Path=/' }),
    }))

    const client = new DinoRankApiClient('juan@example.com', 'Secret123!', sessionPath())
    await expect(client.get('https://dinorank.com/foo', 'https://dinorank.com/bar')).resolves.toBe('hello')
  })

  it('post returns response text and merges cookies', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse('posted', {
      headers: new Headers({ 'set-cookie': 'a=1; Path=/' }),
    }))

    const client = new DinoRankApiClient('juan@example.com', 'Secret123!', sessionPath())
    await expect(client.post('https://dinorank.com/ajax/test.php', 'x=1', 'https://dinorank.com/foo')).resolves.toBe('posted')
  })

  it('retries post on socket errors', async () => {
    fetchMock
      .mockRejectedValueOnce(Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' }))
      .mockResolvedValueOnce(makeResponse('posted'))

    const client = new DinoRankApiClient('juan@example.com', 'Secret123!', sessionPath())
    await expect(client.post('https://dinorank.com/ajax/test.php', 'x=1', 'https://dinorank.com/foo')).resolves.toBe('posted')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('extractContentCredits', () => {
  it('parses DinoBRAIN credits from Spanish HTML', () => {
    const client = new DinoRankApiClient('juan@example.com', 'Secret123!', sessionPath())
    expect(client.extractContentCredits('<div>DinoBRAIN: 5</div>')).toBe(5)
  })

  it('parses Content credits from English HTML', () => {
    const client = new DinoRankApiClient('juan@example.com', 'Secret123!', sessionPath())
    expect(client.extractContentCredits('<div>Content: 7</div>')).toBe(7)
  })

  it('returns 0 when no match exists', () => {
    const client = new DinoRankApiClient('juan@example.com', 'Secret123!', sessionPath())
    expect(client.extractContentCredits('<div>No credits</div>')).toBe(0)
  })
})

describe('session file', () => {
  it('creates a session file on login', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse('login page', {
        headers: new Headers({ 'set-cookie': 'PHPSESSID=abc123; Path=/, csrf_token=tok123; Path=/' }),
      }))
      .mockResolvedValueOnce(makeResponse('{"status":"activo"}', {
        headers: new Headers({ 'set-cookie': 'logged_in=1; Path=/' }),
      }))
      .mockResolvedValueOnce(makeResponse('homed page'))
      .mockResolvedValueOnce(makeResponse('keyword-research page'))

    const client = new DinoRankApiClient('juan@example.com', 'Secret123!', sessionPath())
    await client.login('es')
    expect(client.getCookieHeader()).not.toBe('')
  })

  it('preserves existing sessions while adding the new one', async () => {
    const file = sessionPath()
    writeFileSync(file, JSON.stringify({ 'other@example.com': 'other=session' }, null, 2))
    fetchMock
      .mockResolvedValueOnce(makeResponse('login page', {
        headers: new Headers({ 'set-cookie': 'PHPSESSID=abc123; Path=/, csrf_token=tok123; Path=/' }),
      }))
      .mockResolvedValueOnce(makeResponse('{"status":"activo"}', {
        headers: new Headers({ 'set-cookie': 'logged_in=1; Path=/' }),
      }))
      .mockResolvedValueOnce(makeResponse('homed page'))
      .mockResolvedValueOnce(makeResponse('keyword-research page'))

    const client = new DinoRankApiClient('juan@example.com', 'Secret123!', file)
    await client.login('es')
    expect(client.getCookieHeader()).not.toBe('')
    const sessions = JSON.parse(readFileSync(file, 'utf-8')) as Record<string, string>
    expect(sessions['other@example.com']).toBe('other=session')
    expect(sessions['juan@example.com']).toContain('PHPSESSID=abc123')
  })

  it('clears its own session on logout', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse('login page'))
      .mockResolvedValueOnce(makeResponse('{"status":"activo"}'))
      .mockResolvedValueOnce(makeResponse('homed page'))
      .mockResolvedValueOnce(makeResponse('keyword-research page'))
      .mockResolvedValueOnce(makeResponse('logout ok'))

    const client = new DinoRankApiClient('juan@example.com', 'Secret123!', sessionPath())
    await client.login('es')
    await client.logout()
    expect(client.getCookieHeader()).toBe('')
  })
})
