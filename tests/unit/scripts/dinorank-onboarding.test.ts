import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDinoRankAccount } from '../../../src/scripts/scrape-dinorank'

// Mock fetch globally
global.fetch = vi.fn()

describe('DinoRank Onboarding HTTP Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should complete the full registration and onboarding sequence', async () => {
    // 1. Mock initial register page hit (cookies)
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: {
        getSetCookie: () => ['PHPSESSID=test; path=/', 'csrf_token=test; path=/']
      }
    })

    // 2. Mock registration POST
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => 'creado satisfactoriamente',
      headers: { getSetCookie: () => [] }
    })

    // 3. Mock homed GET
    ;(fetch as any).mockResolvedValueOnce({ ok: true, text: async () => 'homed', headers: { getSetCookie: () => [] } })
    
    // 4. Mock onboarding GET
    ;(fetch as any).mockResolvedValueOnce({ ok: true, text: async () => 'onboarding', headers: { getSetCookie: () => [] } })

    // 5. Mock Onboarding Steps (9 requests)
    const mockResponse = {
      ok: true,
      text: async () => 'ok',
      headers: {
        getSetCookie: () => []
      }
    }
    for (let i = 0; i < 15; i++) {
      ;(fetch as any).mockResolvedValueOnce(mockResponse)
    }

    const result = await createDinoRankAccount()

    expect(result.email).toBeDefined()
    expect(result.password).toBeDefined()
    
    // Total requests: 18 based on the code analysis
    expect(fetch).toHaveBeenCalledTimes(18)
    
    // Verify sequence
    const calls = vi.mocked(fetch).mock.calls
    expect(calls[0][0]).toContain('registro')
    expect(calls[1][0]).toContain('registro1.php')
    expect(calls[2][0]).toContain('homed')
    expect(calls[3][0]).toContain('onboarding')
    expect(calls[11][0]).toContain('agregaDominio.php')
    expect(calls[15][0]).toContain('agregarKeyword.php')
    expect(calls[17][0]).toContain('verOnboardingPasosDetalle.php')
  })
})
