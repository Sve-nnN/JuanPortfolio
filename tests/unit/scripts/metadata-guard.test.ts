import { describe, expect, it } from 'vitest'
import { validateAndRepairMetadata } from '../../../src/scripts/engine/metadata-guard'

describe('validateAndRepairMetadata', () => {
  it('flags invalid metadata when title or metaTitle is missing', () => {
    const result = validateAndRepairMetadata(
      {
        title: '',
        metaTitle: '',
        metaDescription: 'A'.repeat(130),
      },
      'seo content strategy',
    )

    expect(result.valid).toBe(false)
    expect(result.issues).toContain('Missing title')
    expect(result.issues).toContain('Missing metaTitle')
  })

  it('repairs out-of-range metaDescription with deterministic fallback', () => {
    const result = validateAndRepairMetadata(
      {
        title: 'SEO Content Strategy',
        metaTitle: 'SEO Content Strategy Guide',
        metaDescription: 'too short',
      },
      'seo content strategy',
    )

    expect(result.valid).toBe(true)
    expect(result.repaired).toBe(true)
    expect(result.metadata.metaDescription.length).toBeGreaterThanOrEqual(120)
    expect(result.metadata.metaDescription.length).toBeLessThanOrEqual(160)
  })

  it('passes valid metadata untouched', () => {
    const metadata = {
      title: 'Dynamic Programming',
      metaTitle: 'Dynamic Programming Guide',
      metaDescription:
        'Dynamic programming guide with practical examples, complexity notes, and implementation patterns for interview and production use.',
    }

    const result = validateAndRepairMetadata(metadata, 'dynamic programming')

    expect(result.valid).toBe(true)
    expect(result.repaired).toBe(false)
    expect(result.metadata).toEqual(metadata)
  })
})
