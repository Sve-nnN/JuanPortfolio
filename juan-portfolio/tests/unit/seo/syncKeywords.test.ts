import { describe, it, expect, vi, beforeEach } from 'vitest'
import { enrichWithFaqs, parseKeywordsMarkdown, type KeywordData } from '../../../src/scripts/syncKeywords'

// ── Helpers ────────────────────────────────────────────────────────────────

function makeKeyword(keyword: string, overrides: Partial<KeywordData> = {}): KeywordData {
  return {
    keyword,
    targetURL: `https://juan-tech.com/blog/${keyword}`,
    volume: 500,
    difficulty: 30,
    intent: 'Informational',
    source: 'Manual',
    ...overrides,
  }
}

// ── parseKeywordsMarkdown ──────────────────────────────────────────────────

describe('parseKeywordsMarkdown', () => {
  it('returns empty array when no divider is found', () => {
    const result = parseKeywordsMarkdown('no table here')
    expect(result).toEqual([])
  })

  it('skips the header row', () => {
    const md = `
| Keyword | Target URL | Volume | Difficulty | Intent | Status | Last Updated | Source |
| ------- | ---------- | ------ | ---------- | ------ | ------ | ------------ | ------ |
| Keyword | /kw        | 0      | 0          | Info   | -      | -            | Manual |
`.trim()
    const result = parseKeywordsMarkdown(md)
    expect(result).toHaveLength(0)
  })

  it('parses a valid keyword row', () => {
    const md = `
| Keyword | Target URL | Volume | Difficulty | Intent | Status | Last Updated | Source |
| ------- | ---------- | ------ | ---------- | ------ | ------ | ------------ | ------ |
| seo técnico | /blog/seo | 1200 | 25 | Informational | Active | 2026-01-01 | Manual |
`.trim()
    const result = parseKeywordsMarkdown(md)
    expect(result).toHaveLength(1)
    expect(result[0].keyword).toBe('seo técnico')
    expect(result[0].volume).toBe(1200)
    expect(result[0].difficulty).toBe(25)
    expect(result[0].intent).toBe('Informational')
  })

  it('defaults intent to Informational for unknown values', () => {
    const md = `
| Keyword | URL | Volume | Diff | Intent | Status | Date | Source |
| ------- | --- | ------ | ---- | ------ | ------ | ---- | ------ |
| test kw | /t  | 100    | 10   | UnknownIntent | - | - | Manual |
`.trim()
    const result = parseKeywordsMarkdown(md)
    expect(result[0].intent).toBe('Informational')
  })

  it('skips rows with fewer than 7 columns', () => {
    const md = `
| Keyword | URL |
| ------- | --- |
| short   | /s  |
`.trim()
    const result = parseKeywordsMarkdown(md)
    expect(result).toHaveLength(0)
  })
})

// ── enrichWithFaqs ─────────────────────────────────────────────────────────

describe('enrichWithFaqs', () => {
  const mockAdapter = {
    fetchMetrics: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('enriches keywords with paaQuestions when SerpAPI returns results', async () => {
    mockAdapter.fetchMetrics.mockResolvedValue({
      volume: 1000,
      difficulty: 20,
      paaCount: 3,
      paaQuestions: [
        '¿Qué es el SEO técnico?',
        '¿Cómo mejorar el SEO de una web?',
        '¿Cuáles son los factores de SEO más importantes?',
      ],
    })

    const keywords = [makeKeyword('seo técnico')]
    const { enriched, failed } = await enrichWithFaqs(keywords, mockAdapter, 0)

    expect(enriched).toBe(1)
    expect(failed).toBe(0)
    expect(keywords[0].paaQuestions).toEqual([
      '¿Qué es el SEO técnico?',
      '¿Cómo mejorar el SEO de una web?',
      '¿Cuáles son los factores de SEO más importantes?',
    ])
    expect(keywords[0].paaCount).toBe(3)
  })

  it('does not overwrite paaQuestions when SerpAPI returns no questions', async () => {
    mockAdapter.fetchMetrics.mockResolvedValue({
      volume: 500,
      difficulty: 15,
      paaCount: 0,
      paaQuestions: [],
    })

    const existingQuestions = ['¿Pregunta preexistente?']
    const keywords = [makeKeyword('test keyword', { paaQuestions: existingQuestions })]
    await enrichWithFaqs(keywords, mockAdapter, 0)

    // paaQuestions should remain unchanged since empty array was returned
    expect(keywords[0].paaQuestions).toEqual(existingQuestions)
  })

  it('handles multiple keywords independently', async () => {
    mockAdapter.fetchMetrics
      .mockResolvedValueOnce({
        volume: 800,
        difficulty: 30,
        paaCount: 2,
        paaQuestions: ['Q1 for keyword A', 'Q2 for keyword A'],
      })
      .mockResolvedValueOnce({
        volume: 600,
        difficulty: 40,
        paaCount: 1,
        paaQuestions: ['Q1 for keyword B'],
      })

    const keywords = [makeKeyword('keyword-a'), makeKeyword('keyword-b')]
    const { enriched } = await enrichWithFaqs(keywords, mockAdapter, 0)

    expect(enriched).toBe(2)
    expect(keywords[0].paaQuestions).toEqual(['Q1 for keyword A', 'Q2 for keyword A'])
    expect(keywords[1].paaQuestions).toEqual(['Q1 for keyword B'])
    expect(mockAdapter.fetchMetrics).toHaveBeenCalledTimes(2)
    expect(mockAdapter.fetchMetrics).toHaveBeenNthCalledWith(1, 'keyword-a', 'en')
    expect(mockAdapter.fetchMetrics).toHaveBeenNthCalledWith(2, 'keyword-b', 'en')
  })

  it('counts failed requests when SerpAPI throws', async () => {
    mockAdapter.fetchMetrics.mockRejectedValue(new Error('Network error'))

    const keywords = [makeKeyword('broken keyword')]
    const { enriched, failed } = await enrichWithFaqs(keywords, mockAdapter, 0)

    expect(enriched).toBe(0)
    expect(failed).toBe(1)
    // paaQuestions should remain undefined on failure
    expect(keywords[0].paaQuestions).toBeUndefined()
  })

  it('handles null response from SerpAPI gracefully', async () => {
    mockAdapter.fetchMetrics.mockResolvedValue(null)

    const keywords = [makeKeyword('no-result keyword')]
    const { enriched, failed } = await enrichWithFaqs(keywords, mockAdapter, 0)

    expect(enriched).toBe(0)
    expect(failed).toBe(0)
    expect(keywords[0].paaQuestions).toBeUndefined()
  })

  it('respects the delay between requests', async () => {
    mockAdapter.fetchMetrics.mockResolvedValue({
      volume: 100,
      difficulty: 10,
      paaCount: 1,
      paaQuestions: ['Q1'],
    })

    const keywords = [makeKeyword('kw1'), makeKeyword('kw2')]
    const start = Date.now()
    await enrichWithFaqs(keywords, mockAdapter, 50)
    const elapsed = Date.now() - start

    // Two keywords × 50ms delay = at least ~100ms
    expect(elapsed).toBeGreaterThanOrEqual(90)
  })

  it('returns zero counts for empty keywords array', async () => {
    const { enriched, failed } = await enrichWithFaqs([], mockAdapter, 0)
    expect(enriched).toBe(0)
    expect(failed).toBe(0)
    expect(mockAdapter.fetchMetrics).not.toHaveBeenCalled()
  })
})
