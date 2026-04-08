import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GSCAdapter } from '../../../src/scripts/seo/adapters/GSCAdapter'

// Mock environment variables
const originalEnv = process.env

// Use vi.hoisted to create variables available in mock factory
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  inspect: vi.fn(),
  listSitemaps: vi.fn(),
}))

vi.mock('googleapis', () => {
  return {
    google: {
      auth: {
        // Mock JWT as a class
        JWT: class MockJWT {
          constructor() {}
        },
      },
      searchconsole: vi.fn().mockReturnValue({
        searchanalytics: {
          query: mocks.query,
        },
        urlInspection: {
          index: {
            inspect: mocks.inspect,
          },
        },
        sitemaps: {
          list: mocks.listSitemaps,
        },
      }),
    },
  }
})

describe('GSCAdapter', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    process.env.GSC_CLIENT_EMAIL = 'test@example.com'
    process.env.GSC_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----'
    process.env.GSC_PROPERTY_URL = 'https://example.com'
    
    mocks.query.mockReset()
    mocks.inspect.mockReset()
    mocks.listSitemaps.mockReset()
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  it('should initialize correctly with valid environment variables', () => {
    const adapter = new GSCAdapter()
    expect(adapter).toBeDefined()
  })

  it('should throw error if environment variables are missing', () => {
    delete process.env.GSC_CLIENT_EMAIL
    expect(() => new GSCAdapter()).toThrow()
  })

  it('should fetch performance data correctly', async () => {
    mocks.query.mockResolvedValue({
      data: {
        rows: [
          {
            keys: ['2023-01-01', '/test-page', 'test query', 'us', 'mobile'],
            clicks: 10,
            impressions: 100,
            ctr: 0.1,
            position: 1,
          },
        ],
      },
    })

    const adapter = new GSCAdapter()
    const data = await adapter.fetchPerformance('2023-01-01', '2023-01-02')

    expect(data).toHaveLength(1)
    expect(data[0].page).toBe('/test-page')
    expect(data[0].clicks).toBe(10)
    expect(mocks.query).toHaveBeenCalled()
  })

  it('should inspect URL correctly', async () => {
    mocks.inspect.mockResolvedValue({
      data: {
        inspectionResult: {
          indexStatusResult: {
            verdict: 'PASS',
          },
        },
      },
    })

    const adapter = new GSCAdapter()
    const result = await adapter.inspectUrl('https://example.com/page')

    expect(result).toBeDefined()
    expect(result.indexStatusResult.verdict).toBe('PASS')
    expect(mocks.inspect).toHaveBeenCalled()
  })
})
