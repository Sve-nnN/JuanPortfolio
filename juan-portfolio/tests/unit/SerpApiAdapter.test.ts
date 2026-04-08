import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SerpApiAdapter } from '../../src/scripts/seo/adapters/SerpApiAdapter'

describe('SerpApiAdapter', () => {
  let adapter: SerpApiAdapter

  beforeEach(() => {
    process.env.SERPAPI_API_KEY = 'test_key'
    adapter = new SerpApiAdapter()
    vi.clearAllMocks()
  })

  it('should correctly parse a simulated serpapi response', async () => {
    const mockResponse = {
      related_questions: [
        { question: '¿Qué es el contenido eeat?' },
        { question: '¿Cuáles son los 4 pilares de un SEO?' },
        { question: '¿Qué es eeat?' },
        { question: '¿Qué significan las siglas E-E-A-T?' }
      ],
      ai_overview: {
        text_blocks: [
          { type: 'paragraph', snippet: 'Los 4 pilares fundamentales del SEO son: SEO Técnico, SEO On-Page, SEO Off-Page y Contenido' },
          { type: 'heading', snippet: 'Desglose de los pilares:' },
          { type: 'paragraph', snippet: 'Otro párrafo importante.' }
        ]
      },
      organic_results: [
        {
          position: 1,
          title: 'el E-A-T adquiere una E adicional de Experiencia',
          link: 'https://developers.google.com/search/blog/2022/12/google-raters-guidelines-e-e-a-t?hl=es',
          snippet: 'El E-E-A-T ahora es parte de las directrices...'
        },
        {
          position: 2,
          title: 'E-E-A-T SEO Google [2026]',
          link: 'https://ninjaseo.es/eeat-seo-google/',
          snippet: 'El EEAT es un conjunto de criterios...'
        }
      ],
      search_information: {
        total_results: 101000
      }
    }

    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    const metrics = await adapter.fetchMetrics('guia eeat', 'es')

    expect(metrics).not.toBeNull()
    if (!metrics) return

    // 1. PAA Questions (Related Questions)
    expect(metrics.paaQuestions).toBeDefined()
    expect(metrics.paaQuestions?.length).toBe(4)
    expect(metrics.paaQuestions).toContain('¿Qué es el contenido eeat?')

    // 2. AI Overview
    expect(metrics.hasAiOverview).toBe(true)
    expect(metrics.aiOverviewSnippet).toContain('Los 4 pilares fundamentales del SEO son')
    expect(metrics.aiOverviewSnippet).toContain('Otro párrafo importante')

    // 3. Organic Results & Competitor Data
    expect(metrics.topUrls?.[0]).toBe('https://developers.google.com/search/blog/2022/12/google-raters-guidelines-e-e-a-t?hl=es')
    expect(metrics.competitorData?.length).toBe(2)
    expect(metrics.competitorData?.[0].title).toBe('el E-A-T adquiere una E adicional de Experiencia')
    
    // 4. Volume proxy
    expect(metrics.volume).toBe(101000)
  })

  it('should return null if API key is missing', async () => {
    process.env.SERPAPI_API_KEY = ''
    const localAdapter = new SerpApiAdapter()
    const metrics = await localAdapter.fetchMetrics('test')
    expect(metrics).toBeNull()
  })
})
