import { describe, expect, it } from 'vitest'
import { assignKeywords } from '../../../src/scripts/engine/keyword-assigner'
import { type AssignmentInput } from '../../../src/scripts/engine/types'

describe('assignKeywords', () => {
  it('assigns at most one keyword per gap', () => {
    const input: AssignmentInput = {
      gaps: [
        {
          locale: 'en',
          category: 'seo',
          slug: 'seo-content-strategy',
          targetUrl: '/seo/seo-content-strategy',
          source: 'keywords_backlog',
        },
      ],
      keywordPool: [
        {
          keyword: 'seo content strategy',
          locale: 'en',
          category: 'seo',
          slug: 'seo-content-strategy',
          targetUrl: '/seo/seo-content-strategy',
          volume: 4100,
          difficulty: 8,
          status: 'Pendiente',
          source: 'keywords_backlog',
        },
        {
          keyword: 'pillar page seo',
          locale: 'en',
          category: 'seo',
          slug: 'pillar-page-seo',
          targetUrl: '/seo/pillar-page-seo',
          volume: 450,
          difficulty: 24,
          status: 'Pendiente',
          source: 'keywords_backlog',
        },
      ],
    }

    const result = assignKeywords(input)
    expect(result).toHaveLength(1)
    expect(result[0]?.keyword).toBe('seo content strategy')
  })

  it('does not reuse a consumed keyword in the same run', () => {
    const input: AssignmentInput = {
      gaps: [
        {
          locale: 'en',
          category: 'seo',
          slug: 'seo-content-strategy',
          targetUrl: '/seo/seo-content-strategy',
          source: 'keywords_backlog',
        },
        {
          locale: 'en',
          category: 'seo',
          slug: 'topic-clusters-seo',
          targetUrl: '/seo/topic-clusters-seo',
          source: 'keywords_backlog',
        },
      ],
      keywordPool: [
        {
          keyword: 'seo content strategy',
          locale: 'en',
          category: 'seo',
          slug: 'seo-content-strategy',
          targetUrl: '/seo/seo-content-strategy',
          volume: 4100,
          difficulty: 8,
          status: 'Pendiente',
          source: 'keywords_backlog',
        },
      ],
    }

    const result = assignKeywords(input)
    expect(result).toHaveLength(1)
    expect(result[0]?.gap.slug).toBe('seo-content-strategy')
  })

  it('uses deterministic tie-breaking by score then lexical keyword', () => {
    const input: AssignmentInput = {
      gaps: [
        {
          locale: 'en',
          category: 'tech-seo',
          slug: 'technical-seo-checklist',
          targetUrl: '/tech-seo/technical-seo-checklist',
          source: 'keywords_backlog',
        },
      ],
      keywordPool: [
        {
          keyword: 'z keyword',
          locale: 'en',
          category: 'tech-seo',
          slug: 'another-slug',
          targetUrl: '/tech-seo/z-keyword',
          volume: 100,
          difficulty: 10,
          status: 'Pendiente',
          source: 'keywords_backlog',
        },
        {
          keyword: 'a keyword',
          locale: 'en',
          category: 'tech-seo',
          slug: 'another-slug-2',
          targetUrl: '/tech-seo/a-keyword',
          volume: 100,
          difficulty: 10,
          status: 'Pendiente',
          source: 'keywords_backlog',
        },
      ],
    }

    const result = assignKeywords(input)
    expect(result).toHaveLength(1)
    expect(result[0]?.keyword).toBe('a keyword')
  })
})
