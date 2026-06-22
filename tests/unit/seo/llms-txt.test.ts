import { describe, it, expect } from 'vitest'
import { buildLlmsTxt, cleanLlmTitle } from '@/utilities/llmsTxt'

const SITE = 'https://juan-tech.com'

/**
 * Regression suite for the SEO audit (jun-2026) llms.txt fix (issue #21):
 * the CMS `summary` field held the whole context document (with its own H1),
 * producing a `# # ...` heading and the identity block twice.
 */
describe('cleanLlmTitle', () => {
  it('strips a leading markdown heading hash from the summary', () => {
    expect(cleanLlmTitle('# Juan Tech - AI & LLM Context File\nmore')).toBe(
      'Juan Tech - AI & LLM Context File',
    )
  })

  it('falls back to a default when summary is empty', () => {
    expect(cleanLlmTitle('')).toBe('Juan Tech Portfolio & Blog')
    expect(cleanLlmTitle(null)).toBe('Juan Tech Portfolio & Blog')
  })
})

describe('buildLlmsTxt', () => {
  it('never emits a double-hash H1', () => {
    const out = buildLlmsTxt({
      summary: '# Juan Tech - AI & LLM Context File',
      fullContent: 'Body text.',
      siteUrl: SITE,
    })
    expect(out.startsWith('# Juan Tech - AI & LLM Context File')).toBe(true)
    expect(out).not.toContain('# #')
  })

  it('does not duplicate the identity block when summary and fullContent overlap', () => {
    const doc = '# Juan Tech - AI & LLM Context File\nIdentity: technical SEO consultant.'
    const out = buildLlmsTxt({ summary: doc, fullContent: doc, siteUrl: SITE })
    const occurrences = out.split('Identity: technical SEO consultant.').length - 1
    expect(occurrences).toBe(1)
    // The H1 line itself must appear exactly once.
    expect(out.split('# Juan Tech - AI & LLM Context File').length - 1).toBe(1)
  })

  it('renders the recent-posts knowledge graph with absolute URLs', () => {
    const out = buildLlmsTxt({
      summary: '# Juan Tech',
      fullContent: 'Body',
      siteUrl: SITE,
      posts: [
        {
          title: 'Schema Guide',
          slug: 'schema-guide',
          categories: [{ title: 'Tech SEO', slug: 'tech-seo' }],
          meta: { description: 'How to add schema.' },
        },
      ],
    })
    expect(out).toContain('### Schema Guide')
    expect(out).toContain(`- **URL**: ${SITE}/blog/tech-seo/schema-guide`)
  })
})
