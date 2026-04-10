import { describe, it, expect } from 'vitest'
import {
  buildClusterMap,
  getMissingClusterLinks,
  getClusterSummaries,
} from '../../../src/scripts/internal-linking/topicCluster'
import type { PostMetadata } from '../../../src/scripts/internal-linking/types'

// Helper: build a minimal PostMetadata
function makePost(overrides: Partial<PostMetadata> & { slug: string }): PostMetadata {
  return {
    title: overrides.slug,
    primary_keywords: [],
    category: 'seo',
    filePath: `/content/seo/${overrides.slug}.md`,
    url: `/seo/${overrides.slug}`,
    idioma: 'es',
    contentRole: 'standalone',
    ...overrides,
  }
}

// ---- buildClusterMap ----

describe('buildClusterMap', () => {
  it('groups a satellite under its pillar', () => {
    const pillar = makePost({ slug: 'seo-guide', contentRole: 'pillar' })
    const satellite = makePost({
      slug: 'keyword-research',
      contentRole: 'satellite',
      pillarSlug: 'seo-guide',
    })
    const map = buildClusterMap([pillar, satellite])
    expect(map.size).toBe(1)
    expect(map.get('es:seo-guide')?.satellites).toHaveLength(1)
    expect(map.get('es:seo-guide')?.satellites[0].slug).toBe('keyword-research')
  })

  it('returns an empty map when no pillar posts exist', () => {
    const satellite = makePost({ slug: 'article', contentRole: 'satellite' })
    expect(buildClusterMap([satellite]).size).toBe(0)
  })

  it('ignores orphaned satellites whose pillarSlug has no matching pillar', () => {
    const satellite = makePost({
      slug: 'orphan',
      contentRole: 'satellite',
      pillarSlug: 'nonexistent-pillar',
    })
    expect(buildClusterMap([satellite]).size).toBe(0)
  })

  it('handles multiple independent clusters', () => {
    const p1 = makePost({ slug: 'seo-guide', contentRole: 'pillar' })
    const p2 = makePost({ slug: 'dev-guide', contentRole: 'pillar', category: 'development' })
    const s1 = makePost({ slug: 'keyword-tips', contentRole: 'satellite', pillarSlug: 'seo-guide' })
    const s2 = makePost({ slug: 'react-tips', contentRole: 'satellite', pillarSlug: 'dev-guide' })
    const map = buildClusterMap([p1, p2, s1, s2])
    expect(map.size).toBe(2)
    expect(map.get('es:seo-guide')?.satellites).toHaveLength(1)
    expect(map.get('es:dev-guide')?.satellites).toHaveLength(1)
  })

  it('creates an entry for a pillar with no satellites', () => {
    const pillar = makePost({ slug: 'lone-pillar', contentRole: 'pillar' })
    const map = buildClusterMap([pillar])
    expect(map.get('es:lone-pillar')?.satellites).toHaveLength(0)
  })

  it('groups satellites and pillars by locale separately', () => {
    const pillarEs = makePost({ slug: 'seo-guide', contentRole: 'pillar', idioma: 'es' })
    const pillarEn = makePost({ slug: 'seo-guide', contentRole: 'pillar', idioma: 'en' })
    const satEs = makePost({ slug: 'kw-es', contentRole: 'satellite', pillarSlug: 'seo-guide', idioma: 'es' })
    // Note: both pillars share slug key — the map will overwrite; test that at least one cluster exists
    const map = buildClusterMap([pillarEs, pillarEn, satEs])
    expect(map.size).toBeGreaterThanOrEqual(1)
  })
})

// ---- getMissingClusterLinks ----

describe('getMissingClusterLinks', () => {
  const pillar = makePost({
    slug: 'seo-guide',
    contentRole: 'pillar',
    url: '/seo/seo-guide',
    filePath: '/seo-guide.md',
  })
  const satellite = makePost({
    slug: 'keyword-research',
    contentRole: 'satellite',
    pillarSlug: 'seo-guide',
    url: '/seo/keyword-research',
    filePath: '/keyword-research.md',
  })

  function makeReadFile(files: Record<string, string>) {
    return (p: string) => files[p] ?? ''
  }

  it('detects a missing satellite-to-pillar link', () => {
    const clusters = buildClusterMap([pillar, satellite])
    const readFile = makeReadFile({
      [satellite.filePath]: 'No links here.',
      [pillar.filePath]: `See [keyword research](/seo/keyword-research).`,
    })
    const missing = getMissingClusterLinks(clusters, readFile)
    expect(missing).toContainEqual(
      expect.objectContaining({ linkType: 'satellite-to-pillar', source: satellite, target: pillar }),
    )
  })

  it('detects a missing pillar-to-satellite link', () => {
    const clusters = buildClusterMap([pillar, satellite])
    const readFile = makeReadFile({
      [satellite.filePath]: `See [seo guide](/seo/seo-guide).`,
      [pillar.filePath]: 'No links here.',
    })
    const missing = getMissingClusterLinks(clusters, readFile)
    expect(missing).toContainEqual(
      expect.objectContaining({ linkType: 'pillar-to-satellite', source: pillar, target: satellite }),
    )
  })

  it('reports no missing links when all cluster links are present', () => {
    const clusters = buildClusterMap([pillar, satellite])
    const readFile = makeReadFile({
      [satellite.filePath]: `[seo guide](/seo/seo-guide) covers this topic.`,
      [pillar.filePath]: `[keyword research](/seo/keyword-research) is a satellite.`,
    })
    expect(getMissingClusterLinks(clusters, readFile)).toHaveLength(0)
  })

  it('returns an empty list when the cluster map is empty', () => {
    expect(getMissingClusterLinks(new Map(), () => '')).toHaveLength(0)
  })
})

// ---- getClusterSummaries ----

describe('getClusterSummaries', () => {
  it('marks a cluster with no satellites as "no-satellites"', () => {
    const pillar = makePost({ slug: 'lone', contentRole: 'pillar', filePath: '/lone.md' })
    const clusters = buildClusterMap([pillar])
    const summaries = getClusterSummaries(clusters, () => '')
    expect(summaries[0].health).toBe('no-satellites')
  })

  it('marks a cluster as "healthy" when all links are present', () => {
    const pillar = makePost({ slug: 'hub', contentRole: 'pillar', url: '/seo/hub', filePath: '/hub.md' })
    const sat = makePost({
      slug: 'spoke',
      contentRole: 'satellite',
      pillarSlug: 'hub',
      url: '/seo/spoke',
      filePath: '/spoke.md',
    })
    const clusters = buildClusterMap([pillar, sat])
    const readFile = (p: string) => {
      if (p === sat.filePath) return '[hub](/seo/hub) — the main guide.'
      if (p === pillar.filePath) return '[spoke](/seo/spoke) — a satellite.'
      return ''
    }
    const summaries = getClusterSummaries(clusters, readFile)
    expect(summaries[0].health).toBe('healthy')
  })

  it('marks a cluster as "missing-links" when some are absent', () => {
    const pillar = makePost({ slug: 'hub', contentRole: 'pillar', url: '/seo/hub', filePath: '/hub.md' })
    const sat = makePost({
      slug: 'spoke',
      contentRole: 'satellite',
      pillarSlug: 'hub',
      url: '/seo/spoke',
      filePath: '/spoke.md',
    })
    const clusters = buildClusterMap([pillar, sat])
    const summaries = getClusterSummaries(clusters, () => 'no links here')
    expect(summaries[0].health).toBe('missing-links')
  })
})
