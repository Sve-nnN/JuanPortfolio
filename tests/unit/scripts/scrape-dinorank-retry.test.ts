import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as createPost from '../../../src/scripts/create-post'
import { scrapeWithRetry, internals, DeviceConflictError, NoCreditsError } from '../../../src/scripts/scrape-dinorank'

vi.mock('../../../src/scripts/create-post', () => ({
  loadState: vi.fn(),
  saveState: vi.fn(),
  registerAccount: vi.fn(),
  randomStr: vi.fn(() => 'abc'),
  randomPassword: vi.fn(() => 'pass'),
}))

// Mock fs to avoid actual file operations
vi.mock('fs', () => {
  const mod = {
    existsSync: vi.fn(() => true),
    readFileSync: vi.fn(() => '[]'),
    writeFileSync: vi.fn(),
    appendFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  }
  return { ...mod, default: mod }
})

describe('scrapeWithRetry', () => {
  const mockState = { 
    accounts: [
      { email: 'acc1@test.com', password: 'p1' },
      { email: 'acc2@test.com', password: 'p2' }
    ], 
    currentAccountIndex: 0 
  }
  const keywords = ['test']
  const country = 'es'

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('succeeds on first attempt', async () => {
    const mockResults = [{ keyword: 'test', volume: '100' } as any]
    
    vi.spyOn(internals, 'ensureAccount').mockResolvedValue(mockState.accounts[0]!)
    vi.spyOn(internals, 'scrapeOnce').mockResolvedValue(mockResults)

    const result = await scrapeWithRetry(keywords, country, mockState as any, false)

    expect(result).toEqual(mockResults)
    expect(internals.scrapeOnce).toHaveBeenCalledTimes(1)
  })

  it('retries on DeviceConflictError', async () => {
    const mockResults = [{ keyword: 'test', volume: '100' } as any]
    
    vi.spyOn(internals, 'ensureAccount')
      .mockResolvedValueOnce(mockState.accounts[0]!)
      .mockResolvedValueOnce(mockState.accounts[1]!)

    vi.spyOn(internals, 'scrapeOnce')
      .mockRejectedValueOnce(new DeviceConflictError('acc1@test.com'))
      .mockResolvedValueOnce(mockResults)

    vi.spyOn(internals, 'clearSession').mockImplementation(() => {})

    const result = await scrapeWithRetry(keywords, country, mockState as any, false)

    expect(result).toEqual(mockResults)
    expect(internals.scrapeOnce).toHaveBeenCalledTimes(2)
    expect(internals.ensureAccount).toHaveBeenCalledTimes(2)
    expect(internals.clearSession).toHaveBeenCalledTimes(1)
  })

  it('retries on NoCreditsError and triggers account creation', async () => {
    const mockResults = [{ keyword: 'test', volume: '100' } as any]
    
    vi.spyOn(internals, 'ensureAccount')
      .mockResolvedValueOnce(mockState.accounts[0]!)
      .mockResolvedValueOnce(mockState.accounts[1]!)

    vi.spyOn(internals, 'scrapeOnce')
      .mockRejectedValueOnce(new NoCreditsError('acc1@test.com'))
      .mockResolvedValueOnce(mockResults)

    vi.spyOn(internals, 'createDinoRankAccount').mockResolvedValue({
      email: 'new@test.com',
      password: 'new'
    })
    
    vi.spyOn(internals, 'clearSession').mockImplementation(() => {})

    const result = await scrapeWithRetry(keywords, country, mockState as any, false)

    expect(result).toEqual(mockResults)
    expect(internals.createDinoRankAccount).toHaveBeenCalledTimes(1)
    expect(createPost.registerAccount).toHaveBeenCalledWith(mockState, 'new@test.com', 'new')
  })
})
