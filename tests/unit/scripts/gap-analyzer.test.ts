import { describe, expect, it } from 'vitest'
import { analyzeGaps, buildExistingPostKey } from '../../../src/scripts/engine/gap-analyzer'
import { type NormalizedStrategyRow } from '../../../src/scripts/engine/types'

describe('analyzeGaps', () => {
  it('does not return a row when post already exists', () => {
    const rows: NormalizedStrategyRow[] = [
      {
        keyword: 'seo content strategy',
        targetUrl: '/seo/seo-content-strategy',
        locale: 'en',
        category: 'seo',
        slug: 'seo-content-strategy',
        volume: 4100,
        difficulty: 8,
        status: 'Pendiente',
        source: 'keywords_backlog',
      },
    ]

    const existingPostKeys = new Set([
      buildExistingPostKey('en', 'seo', 'seo-content-strategy'),
    ])

    const result = analyzeGaps({ strategyRows: rows, existingPostKeys })
    expect(result).toEqual([])
  })

  it('returns one normalized gap for missing slug', () => {
    const rows: NormalizedStrategyRow[] = [
      {
        keyword: 'dynamic programming',
        targetUrl: '/cs-fundamentals/dynamic-programming',
        locale: 'en',
        category: 'cs-fundamentals',
        slug: 'dynamic-programming',
        volume: 11000,
        difficulty: 22,
        status: 'Pendiente',
        source: 'keywords_backlog',
      },
    ]

    const result = analyzeGaps({ strategyRows: rows, existingPostKeys: new Set() })
    expect(result).toEqual([
      {
        locale: 'en',
        category: 'cs-fundamentals',
        slug: 'dynamic-programming',
        targetUrl: '/cs-fundamentals/dynamic-programming',
        source: 'keywords_backlog',
      },
    ])
  })

  it('ignores malformed rows without throwing', () => {
    const rows: NormalizedStrategyRow[] = [
      {
        keyword: 'broken row',
        targetUrl: '',
        locale: 'es',
        category: '',
        slug: '',
        volume: 0,
        difficulty: 0,
        status: '',
        source: 'keywords_backlog',
      },
      {
        keyword: 'auditoria seo',
        targetUrl: '/tech-seo/auditoria-seo',
        locale: 'es',
        category: 'tech-seo',
        slug: 'auditoria-seo',
        volume: 1300,
        difficulty: 3,
        status: 'Pendiente',
        source: 'keywords_backlog',
      },
    ]

    const result = analyzeGaps({ strategyRows: rows, existingPostKeys: new Set() })
    expect(result).toHaveLength(1)
    expect(result[0]?.slug).toBe('auditoria-seo')
  })
})
