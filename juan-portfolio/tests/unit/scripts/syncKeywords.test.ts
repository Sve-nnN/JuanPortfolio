import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  enrichWithDinoRank,
  detectLang,
  COUNTRIES_BY_LANG,
  detectIntent,
  KeywordData,
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

describe('detectIntent', () => {
  it('classifies Informational based on modifiers', () => {
    expect(detectIntent('como hacer seo')).toBe('Informational')
    expect(detectIntent('que es payloadcms')).toBe('Informational')
    expect(detectIntent('guia de react')).toBe('Informational')
  })

  it('classifies Navigational based on brands/modifiers', () => {
    expect(detectIntent('github juan')).toBe('Navigational')
    expect(detectIntent('login dinorank')).toBe('Navigational')
  })

  it('classifies Commercial based on comparison modifiers', () => {
    expect(detectIntent('mejores herramientas seo')).toBe('Commercial')
    expect(detectIntent('nextjs vs remix')).toBe('Commercial')
  })

  it('classifies Transactional based on intent modifiers', () => {
    expect(detectIntent('comprar curso seo')).toBe('Transactional')
    expect(detectIntent('descuento hosting')).toBe('Transactional')
    expect(detectIntent('descargar gratis plugin')).toBe('Transactional')
    expect(detectIntent('precio de semrush')).toBe('Transactional')
  })

  it('uses competitor titles to influence scoring', () => {
    const kw = 'seo tecnico'
    const titles = [
      'Guía de SEO Técnico 2025',
      'Qué es el SEO Técnico y cómo optimizarlo',
      'Principios básicos de SEO Técnico',
    ]
    expect(detectIntent(kw, titles)).toBe('Informational')
  })

  it('prioritizes keyword modifiers over titles but sums them up', () => {
    // Keyword "comprar guia seo":
    // Transactional: "comprar" (2)
    // Informational: "guia" (2)
    // Titles:
    // Informational: "Guía" (1), "Aprende" (1)
    // Total: Trans(2), Info(4). So Info wins.
    const kw = 'comprar guia seo'
    const titles = ['Guía definitiva de SEO', 'Aprende SEO paso a paso']
    expect(detectIntent(kw, titles)).toBe('Informational')
  })

  it('defaults to Informational if no modifiers match', () => {
    expect(detectIntent('alfombra roja')).toBe('Informational')
  })
})

describe('detectLang', () => {
  it('detects Spanish with diacritics', () => {
    expect(detectLang('seo técnico')).toBe('es')
  })
  it('detects Spanish with function words', () => {
    expect(detectLang('que es el seo')).toBe('es')
  })
  it('detects unaccented Spanish content words', () => {
    expect(detectLang('seo tecnico')).toBe('es')
  })
  it('defaults to English', () => {
    expect(detectLang('technical seo guide')).toBe('en')
  })
})

describe('COUNTRIES_BY_LANG', () => {
  it('has expected countries for es', () => {
    expect(COUNTRIES_BY_LANG.es).toContain('es')
    expect(COUNTRIES_BY_LANG.es).toContain('mx')
    expect(COUNTRIES_BY_LANG.es).toContain('ar')
  })
  it('has expected countries for en', () => {
    expect(COUNTRIES_BY_LANG.en).toContain('us')
    expect(COUNTRIES_BY_LANG.en).toContain('gb')
  })
})

describe('enrichWithDinoRank', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('updates keywords using valid cached data (fixed country)', async () => {
    const mockCache = {
      seo_es: {
        ...makeEntry('seo', 'es', '1500', '2.00'),
        competency: '0,45',
        trend: [100, 200],
        relatedSearches: 'seo on page, seo off page',
      },
    }

    vi.mocked(scrapeDinorank.loadCache).mockReturnValue(mockCache)
    vi.mocked(scrapeDinorank.isCacheValid).mockReturnValue(true)
    vi.mocked(createPost.loadState).mockReturnValue(mockState)

    const keywords: KeywordData[] = [
      {
        keyword: 'seo',
        country: 'es',
        volume: 0,
        difficulty: 0,
        intent: 'Informational',
        targetURL: '',
        source: 'Manual',
      },
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

  it('scrapes via DinoRank when not found in cache (fixed country)', async () => {
    vi.mocked(scrapeDinorank.loadCache).mockReturnValue({})
    vi.mocked(createPost.loadState).mockReturnValue(mockState)
    vi.mocked(scrapeDinorank.isCacheValid).mockReturnValue(false)

    vi.mocked(scrapeDinorank.scrapeWithRetry).mockResolvedValue([
      {
        ...makeEntry('marketing', 'mx', '400'),
        competency: '0,10',
        trend: [10, 20],
        relatedSearches: 'marketing digital',
      },
    ])

    const keywords: KeywordData[] = [
      {
        keyword: 'marketing',
        country: 'mx',
        volume: 0,
        difficulty: 0,
        intent: 'Informational',
        targetURL: '',
        source: 'Manual',
      },
    ]

    const result = await enrichWithDinoRank(keywords, false, false)

    expect(result.enriched).toBe(1)
    expect(result.failed).toBe(0)
    expect(scrapeDinorank.scrapeWithRetry).toHaveBeenCalledWith(
      ['marketing'],
      'mx',
      mockState,
      false,
    )
    expect(keywords[0].volume).toBe(400)
    expect(keywords[0].difficulty).toBe(10)
    expect(keywords[0].country).toBe('mx')
  })

  it('auto-detects language and fills kwData.language when missing', async () => {
    const mockCache: Record<string, ReturnType<typeof makeEntry>> = {}
    for (const c of COUNTRIES_BY_LANG.es) {
      mockCache[`seo tecnico_${c}`] = makeEntry('seo tecnico', c, c === 'mx' ? '5400' : '1000')
    }

    vi.mocked(scrapeDinorank.loadCache).mockReturnValue(mockCache)
    vi.mocked(scrapeDinorank.isCacheValid).mockReturnValue(true)
    vi.mocked(createPost.loadState).mockReturnValue(mockState)

    const keywords: KeywordData[] = [
      // No language, no country set
      {
        keyword: 'seo tecnico',
        volume: 0,
        difficulty: 0,
        intent: 'Informational',
        targetURL: '',
        source: 'Manual',
      },
    ]

    await enrichWithDinoRank(keywords, false, false)

    // Language should be auto-detected as 'es'
    expect(keywords[0].language).toBe('es')
  })

  it('picks the country with the highest volume when no country is set', async () => {
    const mockCache: Record<string, ReturnType<typeof makeEntry>> = {}
    for (const c of COUNTRIES_BY_LANG.es) {
      mockCache[`seo tecnico_${c}`] = makeEntry('seo tecnico', c, c === 'mx' ? '5400' : '1000')
    }

    vi.mocked(scrapeDinorank.loadCache).mockReturnValue(mockCache)
    vi.mocked(scrapeDinorank.isCacheValid).mockReturnValue(true)
    vi.mocked(createPost.loadState).mockReturnValue(mockState)

    const keywords: KeywordData[] = [
      {
        keyword: 'seo tecnico',
        language: 'es',
        volume: 0,
        difficulty: 0,
        intent: 'Informational',
        targetURL: '',
        source: 'Manual',
      },
    ]

    const result = await enrichWithDinoRank(keywords, false, false)

    expect(result.enriched).toBe(1)
    expect(keywords[0].volume).toBe(5400)
    expect(keywords[0].country).toBe('mx')
    expect(scrapeDinorank.scrapeWithRetry).not.toHaveBeenCalled()
  })
})
