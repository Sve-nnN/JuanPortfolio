import { getPayload } from 'payload'
import { vi, expect, describe, it, beforeEach, afterEach } from 'vitest'

// Mock the getPayload function
const mockFindGlobal = vi.fn().mockResolvedValue({
  colors: {
    accent: '#FF0000',
    text: '#000000',
    muted: '#CCCCCC',
    border: '#EEEEEE',
    buttonBackground: '#00FF00',
    buttonText: '#FFFFFF',
    secondaryButtonBackground: '#0000FF',
    secondaryButtonText: '#000000',
  },
  fonts: {
    primary: 'Arial, sans-serif',
    secondary: 'Georgia, serif',
  },
  borderRadius: '5px',
})

vi.mock('payload', async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    getPayload: vi.fn(() => ({
      findGlobal: mockFindGlobal,
    })),
  }
})

describe('getGlobalStyles', () => {
  let getGlobalStyles: typeof import('@/utilities/getGlobalStyles').getGlobalStyles

  beforeEach(async () => {
    vi.resetModules()
    mockFindGlobal.mockClear()
    vi.useFakeTimers()
    const mod = await import('@/utilities/getGlobalStyles')
    getGlobalStyles = mod.getGlobalStyles
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should fetch and return global styles', async () => {
    const styles = await getGlobalStyles()

    expect(styles).toEqual({
      colors: {
        accent: '#FF0000',
        text: '#000000',
        muted: '#CCCCCC',
        border: '#EEEEEE',
        buttonBackground: '#00FF00',
        buttonText: '#FFFFFF',
        secondaryButtonBackground: '#0000FF',
        secondaryButtonText: '#000000',
      },
      fonts: {
        primary: 'Arial, sans-serif',
        secondary: 'Georgia, serif',
      },
      borderRadius: '5px',
    })
    expect(mockFindGlobal).toHaveBeenCalledTimes(1)
  })

  it('should cache global styles and not refetch within the cache period', async () => {
    // First call
    await getGlobalStyles()
    expect(mockFindGlobal).toHaveBeenCalledTimes(1)

    // Second call within cache period (less than 10 seconds)
    await getGlobalStyles()
    expect(mockFindGlobal).toHaveBeenCalledTimes(1) // Should not be called again

    // Advance timers by more than 10 seconds
    vi.advanceTimersByTime(11 * 1000)

    // Third call after cache period
    await getGlobalStyles()
    expect(mockFindGlobal).toHaveBeenCalledTimes(2) // Should be called again
  })
})
