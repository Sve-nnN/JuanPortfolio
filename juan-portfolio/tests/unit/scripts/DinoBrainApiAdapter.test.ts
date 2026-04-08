import { beforeEach, describe, expect, it, vi } from 'vitest'

const { loginMock, getMock, postMock, logoutMock, extractContentCreditsMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  getMock: vi.fn(),
  postMock: vi.fn(),
  logoutMock: vi.fn(),
  extractContentCreditsMock: vi.fn(),
}))

vi.mock('../../../src/scripts/dinorank/DinoRankApiClient', () => ({
  DinoRankApiClient: class {
    login = loginMock
    get = getMock
    post = postMock
    logout = logoutMock
    extractContentCredits = extractContentCreditsMock
  },
}))

const { loadRegistryMock, updateAccountMock } = vi.hoisted(() => ({
  loadRegistryMock: vi.fn(),
  updateAccountMock: vi.fn(),
}))

vi.mock('../../../src/scripts/utils/accountRegistry', () => ({
  loadRegistry: loadRegistryMock,
  updateAccount: updateAccountMock,
}))

import { DinoBrainApiAdapter } from '../../../src/scripts/dinorank/DinoBrainApiAdapter'

function makeAccount(overrides: Record<string, unknown> = {}) {
  return {
    email: 'juan@example.com',
    password: 'Secret123!',
    keywords: [],
    content: [],
    kwCredits: 150,
    contentCredits: 5,
    createdAt: '2026-04-01T00:00:00.000Z',
    expiresAt: '2026-04-08T00:00:00.000Z',
    lastUsed: '2026-03-31T00:00:00.000Z',
    createdLanguage: 'es',
    createdCountry: 'ES',
    createdDomain: 'juan-tech.com',
    createdProjectType: 'nicho',
    ...overrides,
  }
}

function makeProStep2Html(): string {
  return `
    <div>
      <div class="dbpro-h1-label">Time Complexity in Practice</div>
      <select id="dinobrainProContentType"><option value="blog" selected>Blog</option></select>
      <textarea id="dinobrainProContext">Use practical examples.</textarea>
      <textarea id="dinobrainProExclusions">No filler.</textarea>
      <table id="dinobrainProOutlineTable">
        <tbody>
          <tr data-outline-type="h2" data-format-hint="table">
            <td><span class="dbpro-outline-label">Complexity Classes</span></td>
            <td><input class="dbpro-outline-check" type="checkbox" checked /></td>
            <td><select class="dbpro-length-select"><option value="media" selected>media</option></select></td>
          </tr>
          <tr data-outline-type="h3" data-format-hint="list">
            <td><span class="dbpro-outline-label">Examples</span></td>
            <td><input class="dbpro-outline-child-check" type="checkbox" checked /></td>
          </tr>
        </tbody>
      </table>
    </div>
  `
}

function setupProSuccess(finalHtml: string): void {
  getMock.mockResolvedValue('<html>Consumos restantes: 5</html>')
  postMock.mockImplementation(async (url: string) => {
    if (url.includes('pro-start.php')) {
      return JSON.stringify({
        status: 'ok',
        html: '<input class="dbpro-serp-check" data-url="https://a.com" /><input class="dbpro-serp-check" data-url="https://b.com" />',
      })
    }
    if (url.includes('pro-step1.php')) {
      return JSON.stringify({
        status: 'ok',
        html: '<input class="dbpro-longtail-check" data-keyword="time complexity chart" /><input class="dbpro-longtail-check" data-keyword="big o" />',
      })
    }
    if (url.includes('pro-step2.php')) {
      return JSON.stringify({ status: 'ok', html: makeProStep2Html() })
    }
    if (url.includes('pro-generate.php')) {
      return JSON.stringify({ status: 'ok', id: 304927 })
    }
    if (url.includes('controlIA.php')) {
      return 'finalizado'
    }
    if (url.includes('obtieneContenidoGenerado.php')) {
      return finalHtml
    }
    return JSON.stringify({ status: 'ok' })
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  loadRegistryMock.mockReturnValue([])
  loginMock.mockResolvedValue('ok')
  logoutMock.mockResolvedValue(undefined)
  extractContentCreditsMock.mockReturnValue(5)
})

describe('DinoBrainApiAdapter.generate', () => {
  it('throws when no accounts with content credits are available', async () => {
    loadRegistryMock.mockReturnValue([makeAccount({ contentCredits: 0 })])
    const adapter = new DinoBrainApiAdapter()
    await expect(adapter.generate({ keyword: 'seo' })).rejects.toThrow('No accounts with content credits available')
  })

  it('runs the pro flow and returns generated content', async () => {
    loadRegistryMock.mockReturnValue([makeAccount({ createdLanguage: 'English' })])
    setupProSuccess('<div id=\"textodelcontenido\"><h1>Time Complexity in Practice</h1><p>Intro paragraph.</p></div>')

    const adapter = new DinoBrainApiAdapter()
    const result = await adapter.generate({ keyword: 'time complexity', language: 'en', country: 'US', pollingDelay: 0 })

    expect(result.title).toBe('Time Complexity in Practice')
    expect(result.markdown).toContain('Intro paragraph.')
    expect(postMock.mock.calls.some((call) => String(call[0]).includes('pro-start.php'))).toBe(true)
    expect(postMock.mock.calls.some((call) => String(call[0]).includes('pro-generate.php'))).toBe(true)
  })

  it('extracts content from #textodelcontenido, removes H1 from body and preserves tables', async () => {
    loadRegistryMock.mockReturnValue([makeAccount()])
    setupProSuccess('<div id="textodelcontenido"><h1>My Title</h1><p>Intro</p><table><tr><th>Complexity</th><th>Example</th></tr><tr><td>O(n)</td><td>Linear scan</td></tr></table></div>')

    const adapter = new DinoBrainApiAdapter()
    const result = await adapter.generate({ keyword: 'seo', pollingDelay: 0 })

    expect(result.markdown).toContain('| Complexity | Example |')
    expect(result.markdown).toContain('| O(n) | Linear scan |')
    expect(result.markdown).toContain('Intro')
    expect(result.markdown).not.toContain('My Title')
  })

  it('filters English generation to English-created accounts', async () => {
    loadRegistryMock.mockReturnValue([
      makeAccount({ email: 'es@example.com', createdLanguage: 'Spanish', contentCredits: 9 }),
      makeAccount({ email: 'en@example.com', createdLanguage: 'English', contentCredits: 1 }),
    ])
    setupProSuccess('<div id="textodelcontenido"><h1>English</h1><p>Body</p></div>')

    const adapter = new DinoBrainApiAdapter()
    const result = await adapter.generate({ keyword: 'seo', language: 'en', country: 'US', pollingDelay: 0 })

    expect(result.accountEmail).toBe('en@example.com')
  })

  it('throws a clear error when requesting en and no English account exists', async () => {
    loadRegistryMock.mockReturnValue([
      makeAccount({ email: 'es@example.com', createdLanguage: 'Spanish', contentCredits: 9 }),
    ])
    const adapter = new DinoBrainApiAdapter()
    await expect(adapter.generate({ keyword: 'seo', language: 'en' })).rejects.toThrow('No English DinoBrain accounts with content credits available')
  })

  it('marks cooldownUntil after generation', async () => {
    loadRegistryMock.mockReturnValue([makeAccount()])
    setupProSuccess('<div id="textodelcontenido"><h1>T</h1><p>X</p></div>')

    const adapter = new DinoBrainApiAdapter()
    await adapter.generate({ keyword: 'seo', pollingDelay: 0 })

    expect(updateAccountMock).toHaveBeenCalledWith('juan@example.com', expect.objectContaining({ cooldownUntil: expect.any(String) }))
  })
})
