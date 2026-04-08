import { describe, it, expect, vi } from 'vitest'
import { enrichWithSerpData, KeywordData } from '../../src/scripts/syncKeywords'

describe('syncKeywords enrichment', () => {
  it('should enrich keywords with data from SerpApi', async () => {
    const keywords: KeywordData[] = [
      {
        keyword: 'guia eeat',
        targetURL: '/seo/guia-eeat',
        volume: 0,
        difficulty: 0,
        intent: 'Informational',
        source: 'Manual'
      }
    ]

    const mockAdapter = {
      fetchMetrics: vi.fn().mockResolvedValue({
        paaQuestions: ['¿Qué es el contenido eeat?', '¿Cuáles son los 4 pilares?'],
        paaCount: 2,
        hasAiOverview: true,
        aiOverviewSnippet: 'Snippet de IA',
        topDomain: 'developers.google.com',
        competitorData: [
          { title: 'Comp 1', snippet: 'Desc 1', link: 'https://comp1.com' }
        ]
      })
    }

    const result = await enrichWithSerpData(keywords, mockAdapter as any, 0, false)

    expect(result.enriched).toBe(1)
    expect(keywords[0].paaQuestions?.length).toBe(2)
    expect(keywords[0].hasAiOverview).toBe(true)
    expect(keywords[0].aiOverviewSnippet).toBe('Snippet de IA')
    expect(keywords[0].competitorMeta).toContain('[Comp 1] Desc 1')
  })
})
