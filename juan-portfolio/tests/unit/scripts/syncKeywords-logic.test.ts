import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parseKeywordsMarkdown,
  enrichWithDinoRank,
  enrichWithSerpData,
  enrichWithFaqs,
  detectLang,
  COUNTRIES_BY_LANG,
  formatLine,
} from '../../../src/scripts/syncKeywords'
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

const mockState = { accounts: [], currentAccountIndex: 0, history: [] }

const makeEntry = (keyword: string, country: string, volume: string, cpc = '0.00') => ({
  keyword,
  country,
  volume,
  competency: '0,30',
  cpc,
  trend: [] as number[],
  relatedSearches: '',
  timestamp: new Date().toISOString(),
})

describe('parseKeywordsMarkdown', () => {
  it('parses a standard keywords table correctly', () => {
    const content = `
| Keyword | Target URL | Language | Country | Volume | Difficulty | Intent | Source |
|---|---|---|---|---|---|---|---|
| test keyword | /test | es | es | 1000 | 45 | Informational | Manual |
| other kw | /other | en | us | 500 | 20 | Commercial | DinoRank |
`
    const result = parseKeywordsMarkdown(content)
    expect(result).toHaveLength(2)
    expect(result[0].keyword).toBe('test keyword')
    expect(result[0].volume).toBe(1000)
    expect(result[0].difficulty).toBe(45)
    expect(result[1].keyword).toBe('other kw')
    expect(result[1].country).toBe('us')
  })

  it('handles escaped pipes in keyword and other fields', () => {
    const content = `
| Keyword | Target URL | Language | Country | Volume | Difficulty | Intent | Source |
|---|---|---|---|---|---|---|---|
| keyword with \\| pipe | /test | es | es | 100 | 10 | Informational | Manual |
`
    const result = parseKeywordsMarkdown(content)
    expect(result).toHaveLength(1)
    expect(result[0].keyword).toBe('keyword with | pipe')
  })

  it('handles semicolon-separated arrays (related searches, paa questions)', () => {
    const content = `
| Keyword | Target URL | Volume | Difficulty | Intent | Related Searches | PAA Questions |
|---|---|---|---|---|---|---|
| arrays | / | 0 | 0 | Informational | search 1; search 2 | q1; q2; q3 |
`
    const result = parseKeywordsMarkdown(content)
    expect(result[0].relatedSearches).toEqual(['search 1', 'search 2'])
    expect(result[0].paaQuestions).toEqual(['q1', 'q2', 'q3'])
  })

  it('returns empty array if no divider is found', () => {
    const content = `| Keyword | Volume |
| test | 100 |`
    expect(parseKeywordsMarkdown(content)).toEqual([])
  })

  it('correctly formats a line back to markdown (round-trip)', () => {
    const content = `
| Keyword | Target URL | Language | Country | Volume | Difficulty | Intent | Source |
|---|---|---|---|---|---|---|---|
| test kw | /test | es | es | 1000 | 45 | Informational | Manual |
`
    // Calling parseKeywordsMarkdown sets the activeHeaders global
    const parsed = parseKeywordsMarkdown(content)
    expect(parsed).toHaveLength(1)

    const formatted = formatLine(parsed[0])
    // The order should be preserved based on the headers in content
    expect(formatted).toBe('| test kw | /test | es | es | 1000 | 45 | Informational | Manual |')
  })

  it('handles new fields: Source, Trend, PAA Count', () => {
    const content = `
| Keyword | Target URL | Source | Trend | PAA Count |
|---|---|---|---|---|
| new fields | / | DinoRank | 10,20,30 | 5 |
`
    const result = parseKeywordsMarkdown(content)
    expect(result).toHaveLength(1)
    expect(result[0].source).toBe('DinoRank')
    expect(result[0].trend).toBe('10,20,30')
    expect(result[0].paaCount).toBe(5)

    const formatted = formatLine(result[0])
    expect(formatted).toBe('| new fields | / | DinoRank | 10,20,30 | 5 |')
  })
})

describe('enrichWithDinoRank - Multi-country logic', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(createPost.loadState).mockReturnValue(mockState)
  })

  it('scrapes all countries for a language and picks the one with highest volume (uncached)', async () => {
    vi.mocked(scrapeDinorank.loadCache).mockReturnValue({})
    vi.mocked(scrapeDinorank.isCacheValid).mockReturnValue(false)

    // Mock scrapeWithRetry to return different volumes for different countries
    vi.mocked(scrapeDinorank.scrapeWithRetry).mockImplementation(async (kws, country) => {
      if (country === 'es') return [makeEntry(kws[0], 'es', '1000')]
      if (country === 'mx') return [makeEntry(kws[0], 'mx', '5000')]
      if (country === 'ar') return [makeEntry(kws[0], 'ar', '2000')]
      return [makeEntry(kws[0], country, '0')]
    })

    const keywords = [
      {
        keyword: 'best keyword',
        language: 'es', // Force Spanish
        volume: 0,
        difficulty: 0,
        intent: 'Informational',
        targetURL: '',
        source: 'Manual',
      },
    ]

    const result = await enrichWithDinoRank(keywords, false, true)

    expect(result.enriched).toBe(1)
    expect(keywords[0].volume).toBe(5000)
    expect(keywords[0].country).toBe('mx')
    // Should have called scrapeWithRetry for all ES countries
    expect(scrapeDinorank.scrapeWithRetry).toHaveBeenCalledTimes(COUNTRIES_BY_LANG.es.length)
  })

  it('mixes cached and uncached countries in multi-country search', async () => {
    const mockCache = {
      'test_es': makeEntry('test', 'es', '1000'),
    }
    vi.mocked(scrapeDinorank.loadCache).mockReturnValue(mockCache)
    vi.mocked(scrapeDinorank.isCacheValid).mockImplementation((ts) => !!ts) // simplified

    vi.mocked(scrapeDinorank.scrapeWithRetry).mockImplementation(async (kws, country) => {
      if (country === 'mx') return [makeEntry(kws[0], 'mx', '8000')]
      return [makeEntry(kws[0], country, '0')]
    })

    const keywords = [
      {
        keyword: 'test',
        language: 'es',
        volume: 0,
        difficulty: 0,
        intent: 'Informational',
        targetURL: '',
        source: 'Manual',
      },
    ]

    await enrichWithDinoRank(keywords, false, false)

    expect(keywords[0].volume).toBe(8000)
    expect(keywords[0].country).toBe('mx')
    // Should NOT have scraped 'es' because it was in cache
    const calls = vi.mocked(scrapeDinorank.scrapeWithRetry).mock.calls
    const scrapedCountries = calls.map((c) => c[1])
    expect(scrapedCountries).not.toContain('es')
    expect(scrapedCountries).toContain('mx')
  })

  it('handles various volume formats (thousands separators)', async () => {
    vi.mocked(scrapeDinorank.loadCache).mockReturnValue({})
    vi.mocked(scrapeDinorank.isCacheValid).mockReturnValue(false)

    vi.mocked(scrapeDinorank.scrapeWithRetry).mockImplementation(async (kws) => {
      return [makeEntry(kws[0], 'es', '6.600')] // DinoRank format often uses dots
    })

    const keywords = [
      {
        keyword: 'dot volume',
        country: 'es',
        volume: 0,
        difficulty: 0,
        intent: 'Informational',
        targetURL: '',
        source: 'Manual',
      },
    ]

    await enrichWithDinoRank(keywords, false, false)
    expect(keywords[0].volume).toBe(6600)

    vi.mocked(scrapeDinorank.scrapeWithRetry).mockImplementation(async (kws) => {
      return [makeEntry(kws[0], 'es', '1,200')] // Some formats use commas
    })
    keywords[0].keyword = 'comma volume'
    await enrichWithDinoRank(keywords, false, false)
    expect(keywords[0].volume).toBe(1200)
  })
})

describe('enrichWithSerpData', () => {
  it('enriches keywords with SerpApi data', async () => {
    const mockAdapter = {
      fetchMetrics: vi.fn().mockResolvedValue({
        volume: 1200,
        difficulty: 35,
        paaQuestions: ['q1', 'q2'],
        paaCount: 2,
        hasAiOverview: true,
        aiOverviewSnippet: 'Snippet',
        relatedSearches: ['rel1', 'rel2'],
        topUrls: ['https://comp1.com', 'https://comp2.com'],
        competitorData: [
          { title: 'Comp 1 Title', snippet: 'Comp 1 Snippet', link: 'https://comp1.com' },
        ],
      }),
    }

    const keywords = [
      {
        keyword: 'seo test',
        volume: 0,
        difficulty: 0,
        intent: 'Informational',
        targetURL: '',
        source: 'Manual',
      },
    ]

    // Note: WordCountCrawler logic is also inside enrichment, we might need to mock WordCountCrawler if it's external
    // But KeywordIntelligenceService is used inside enrichWithSerpData

    const result = await enrichWithSerpData(keywords, mockAdapter as any, 0, false)

    expect(result.enriched).toBe(1)
    expect(result.results).toHaveLength(1)
    expect(keywords[0].volume).toBe(1200)
    expect(keywords[0].difficulty).toBe(35)
    expect(keywords[0].paaQuestions).toEqual(['q1', 'q2'])
    expect(keywords[0].hasAiOverview).toBe(true)
    expect(keywords[0].intent).toBe('Informational')
  })
})

describe('enrichWithFaqs', () => {
  it('only updates PAA questions', async () => {
    const mockAdapter = {
      fetchMetrics: vi.fn().mockResolvedValue({
        paaQuestions: ['how to test', 'why test'],
      }),
    }

    const keywords = [
      {
        keyword: 'test faqs',
        volume: 100,
        difficulty: 10,
        intent: 'Informational',
        targetURL: '',
        source: 'Manual',
      },
    ]

    await enrichWithFaqs(keywords, mockAdapter, 0)

    expect(keywords[0].paaQuestions).toEqual(['how to test', 'why test'])
    expect(keywords[0].paaCount).toBe(2)
    // Should NOT change volume/difficulty
    expect(keywords[0].volume).toBe(100)
    expect(keywords[0].difficulty).toBe(10)
  })
})
