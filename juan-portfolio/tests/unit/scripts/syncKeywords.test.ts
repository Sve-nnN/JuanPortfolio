import { describe, it, expect, vi, beforeEach } from 'vitest'
import { enrichWithDinoRank, KeywordData } from '../../../src/scripts/syncKeywords'
import * as scrapeDinorank from '../../../src/scripts/scrape-dinorank'
import * as createPost from '../../../src/scripts/create-post'

vi.mock('../../../src/scripts/scrape-dinorank', () => ({
  loadCache: vi.fn(),
  saveCache: vi.fn(),
  isCacheValid: vi.fn(),
  scrapeWithRetry: vi.fn(),
}))

vi.mock('../../../src/scripts/create-post', () => ({
  loadState: vi.fn(),
}))

describe('enrichWithDinoRank', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('updates keywords using valid cached data', async () => {
    const mockCache = {
      'seo_es': {
        keyword: 'seo',
        country: 'es',
        volume: '1500',
        competency: '0,45', // 45%
        trend: [100, 200],
        relatedSearches: 'seo on page, seo off page',
        timestamp: new Date().toISOString()
      },
    }

    vi.mocked(scrapeDinorank.loadCache).mockReturnValue(mockCache)
    vi.mocked(scrapeDinorank.isCacheValid).mockReturnValue(true)

    const keywords: KeywordData[] = [
      { keyword: 'seo', country: 'es', volume: 0, difficulty: 0, intent: 'Informational', targetURL: '', source: 'Manual' },
    ]

    const result = await enrichWithDinoRank(keywords)

    expect(result.enriched).toBe(1)
    expect(result.failed).toBe(0)
    expect(keywords[0].volume).toBe(1500)
    expect(keywords[0].difficulty).toBe(45)
    expect(keywords[0].trend).toBe('100,200')
    expect(keywords[0].relatedSearches).toEqual(['seo on page', 'seo off page'])
    expect(scrapeDinorank.scrapeWithRetry).not.toHaveBeenCalled()
  })

  it('scrapes via DinoRank when not found in cache', async () => {
    vi.mocked(scrapeDinorank.loadCache).mockReturnValue({})
    vi.mocked(createPost.loadState).mockReturnValue({ accounts: [] })
    
    vi.mocked(scrapeDinorank.scrapeWithRetry).mockResolvedValue([
      {
        keyword: 'marketing',
        country: 'mx',
        volume: '400',
        competency: '0,10',
        trend: [10, 20],
        relatedSearches: 'marketing digital',
        timestamp: new Date().toISOString()
      }
    ])

    const keywords: KeywordData[] = [
      { keyword: 'marketing', country: 'mx', volume: 0, difficulty: 0, intent: 'Informational', targetURL: '', source: 'Manual' },
    ]

    const result = await enrichWithDinoRank(keywords, false, false)

    expect(result.enriched).toBe(1)
    expect(result.failed).toBe(0)
    expect(scrapeDinorank.scrapeWithRetry).toHaveBeenCalledWith(['marketing'], 'mx', { accounts: [] }, false)
    expect(keywords[0].volume).toBe(400)
    expect(keywords[0].difficulty).toBe(10)
    expect(keywords[0].trend).toBe('10,20')
    expect(keywords[0].relatedSearches).toEqual(['marketing digital'])
  })
})
