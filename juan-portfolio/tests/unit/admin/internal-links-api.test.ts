import { describe, it, expect } from 'vitest'
import { mapOpportunityToSuggestion, isPathSafe, escapeRegex } from '@/app/api/internal-links/_helpers'
import type { LinkOpportunity } from '@/scripts/internal-linking/types'

const basePost = {
  slug: 'source-post',
  title: 'Source',
  primary_keywords: ['kw'],
  category: 'tech',
  filePath: '/content/posts/tech/source-post.md',
  url: '/tech/source-post',
  idioma: 'es',
}
const targetPost = {
  slug: 'target-post',
  title: 'Target',
  primary_keywords: ['algo'],
  category: 'tech',
  filePath: '/content/posts/tech/target-post.md',
  url: '/tech/target-post',
  idioma: 'es',
}

const baseOpportunity: LinkOpportunity = {
  sourcePost: basePost,
  targetPost: targetPost,
  keyword: 'big-o',
  context: 'The big-o notation is used to describe algorithm complexity.',
  lineNumber: 5,
  relevance: 0.75,
}

describe('mapOpportunityToSuggestion', () => {
  it('maps all fields correctly', () => {
    const result = mapOpportunityToSuggestion(baseOpportunity)
    expect(result.sourceSlug).toBe('source-post')
    expect(result.targetSlug).toBe('target-post')
    expect(result.targetTitle).toBe('Target')
    expect(result.targetUrl).toBe('/tech/target-post')
    expect(result.keyword).toBe('big-o')
    expect(result.context).toBe('The big-o notation is used to describe algorithm complexity.')
    expect(result.lineNumber).toBe(5)
  })

  it('confidence equals relevance', () => {
    const result = mapOpportunityToSuggestion(baseOpportunity)
    expect(result.confidence).toBe(0.75)
  })

  it('filePath comes from sourcePost.filePath', () => {
    const result = mapOpportunityToSuggestion(baseOpportunity)
    expect(result.filePath).toBe('/content/posts/tech/source-post.md')
  })

  it('includes semantic breakdown when present', () => {
    const oppWithSemantic: LinkOpportunity = {
      ...baseOpportunity,
      semantic: {
        lexicalScore: 0.8,
        clusterScore: 0.6,
        vectorScore: 0.7,
        totalScore: 0.75,
        weights: { lexical: 0.3, cluster: 0.3, vector: 0.4 },
      },
    }
    const result = mapOpportunityToSuggestion(oppWithSemantic)
    expect(result.semantic).toBeDefined()
    expect(result.semantic?.lexicalScore).toBe(0.8)
    expect(result.semantic?.clusterScore).toBe(0.6)
    expect(result.semantic?.vectorScore).toBe(0.7)
    expect(result.semantic?.totalScore).toBe(0.75)
  })

  it('semantic is undefined when opp.semantic is absent', () => {
    const result = mapOpportunityToSuggestion(baseOpportunity)
    expect(result.semantic).toBeUndefined()
  })
})

describe('isPathSafe', () => {
  it('returns true for child path inside contentRoot', () => {
    expect(isPathSafe('/tmp/content/posts/tech/post.md', '/tmp/content')).toBe(true)
  })

  it('returns false for path traversal attempt', () => {
    expect(isPathSafe('/etc/passwd', '/tmp/content')).toBe(false)
  })

  it('returns false when path equals contentRoot exactly', () => {
    expect(isPathSafe('/tmp/content', '/tmp/content')).toBe(false)
  })

  it('returns true for deeply nested path inside contentRoot', () => {
    expect(isPathSafe('/tmp/content/posts/cs-fundamentals/big-o.en.md', '/tmp/content')).toBe(true)
  })

  it('returns false for path that starts with same prefix but is not inside', () => {
    expect(isPathSafe('/tmp/content-evil/posts/post.md', '/tmp/content')).toBe(false)
  })
})

describe('escapeRegex', () => {
  it('escapes special regex characters', () => {
    expect(escapeRegex('a.b*c?')).toBe('a\\.b\\*c\\?')
  })

  it('returns plain string unchanged', () => {
    expect(escapeRegex('big-o notation')).toBe('big-o notation')
  })

  it('escapes all special characters', () => {
    expect(escapeRegex('[test](url)')).toBe('\\[test\\]\\(url\\)')
  })

  it('escapes pipe and dollar sign', () => {
    expect(escapeRegex('a|b$c')).toBe('a\\|b\\$c')
  })
})
