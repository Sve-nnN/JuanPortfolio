import { describe, it, expect, vi, beforeEach } from 'vitest'
import { internals } from '../../../src/scripts/scrape-dinorank'
import * as registryModule from '../../../src/scripts/utils/accountRegistry'

// Mock de las dependencias externas
vi.mock('../../../src/scripts/utils/accountRegistry')
vi.mock('@clack/prompts', () => ({
  log: { info: vi.fn(), warn: vi.fn() },
  note: vi.fn(),
  confirm: vi.fn(() => Promise.resolve(true))
}))

describe('DinoRank Account Rotation Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('presents the first available account with credits', async () => {
    // Simular registro con una cuenta agotada y una disponible
    vi.mocked(registryModule.loadRegistry).mockReturnValue([
      { email: 'exhausted@test.com', password: '123', kwCredits: 0, contentCredits: 0, keywords: [], content: [], lastUsed: '' },
      { email: 'available@test.com', password: '456', kwCredits: 5, contentCredits: 5, keywords: [], content: [], lastUsed: '' }
    ])

    const state: any = { accounts: [] }
    const excluded = new Set<string>()
    
    const account = await (internals as any).ensureAccount(state, excluded)
    
    expect(account.email).toBe('available@test.com')
    expect(registryModule.loadRegistry).toHaveBeenCalled()
  })

  it('rotates to the next account if the current one is excluded (failed in session)', async () => {
    vi.mocked(registryModule.loadRegistry).mockReturnValue([
      { email: 'account1@test.com', password: '123', kwCredits: 5, contentCredits: 5, keywords: [], content: [], lastUsed: '' },
      { email: 'account2@test.com', password: '456', kwCredits: 5, contentCredits: 5, keywords: [], content: [], lastUsed: '' }
    ])

    const state: any = { accounts: [] }
    const excluded = new Set<string>(['account1@test.com']) // account1 ya falló en esta ejecución
    
    const account = await (internals as any).ensureAccount(state, excluded)
    
    expect(account.email).toBe('account2@test.com')
  })

  it('triggers account creation if ALL accounts are exhausted (kwCredits <= 0)', async () => {
    vi.mocked(registryModule.loadRegistry).mockReturnValue([
      { email: 'dead1@test.com', password: '123', kwCredits: 0, contentCredits: 0, keywords: [], content: [], lastUsed: '' },
      { email: 'dead2@test.com', password: '456', kwCredits: 0, contentCredits: 0, keywords: [], content: [], lastUsed: '' }
    ])

    // Mock de creación de cuenta
    const createSpy = vi.spyOn(internals, 'createDinoRankAccount').mockResolvedValue({
      email: 'new@test.com',
      password: 'newpassword'
    })

    const state: any = { accounts: [] }
    const excluded = new Set<string>()
    
    const account = await (internals as any).ensureAccount(state, excluded)
    
    expect(createSpy).toHaveBeenCalled()
    expect(account.email).toBe('new@test.com')
  })

  it('triggers account creation if ALL available accounts are excluded due to errors', async () => {
    vi.mocked(registryModule.loadRegistry).mockReturnValue([
      { email: 'failed@test.com', password: '123', kwCredits: 5, contentCredits: 5, keywords: [], content: [], lastUsed: '' }
    ])

    const createSpy = vi.spyOn(internals, 'createDinoRankAccount').mockResolvedValue({
      email: 'fresh@test.com',
      password: 'pass'
    })

    const state: any = { accounts: [] }
    const excluded = new Set<string>(['failed@test.com']) 
    
    const account = await (internals as any).ensureAccount(state, excluded)
    
    expect(createSpy).toHaveBeenCalled()
    expect(account.email).toBe('fresh@test.com')
  })
})
