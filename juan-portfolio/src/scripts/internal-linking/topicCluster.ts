/**
 * Topic Cluster Logic
 *
 * Implements the hub-and-spoke model for internal linking:
 * - Pillar (hub): broad, comprehensive page targeting a high-volume keyword
 * - Satellite (spoke): deep-dive articles targeting long-tail keywords
 *
 * Rules enforced:
 * 1. Every satellite must link back to its pillar.
 * 2. Every pillar must link out to all its satellites.
 *
 * All functions are pure (except getMissingClusterLinks which uses an injectable
 * readFile for testability).
 */

import type { PostMetadata } from './types'

export interface TopicCluster {
  pillar: PostMetadata
  satellites: PostMetadata[]
}

/** pillarSlug → TopicCluster */
export type ClusterMap = Map<string, TopicCluster>

/**
 * Builds a map of topic clusters from a flat list of posts.
 * Satellites are attached to their declared pillar via `pillarSlug`.
 * Orphaned satellites (pillar not found) are silently ignored.
 */
export function buildClusterMap(posts: PostMetadata[]): ClusterMap {
  const map: ClusterMap = new Map()

  // First pass: register all pillar pages
  for (const post of posts) {
    if (post.contentRole === 'pillar') {
      if (!map.has(post.slug)) {
        map.set(post.slug, { pillar: post, satellites: [] })
      }
    }
  }

  // Second pass: attach satellites to their declared pillar
  for (const post of posts) {
    if (post.contentRole === 'satellite' && post.pillarSlug) {
      const cluster = map.get(post.pillarSlug)
      if (cluster) {
        cluster.satellites.push(post)
      }
    }
  }

  return map
}

export interface MissingClusterLink {
  source: PostMetadata
  target: PostMetadata
  linkType: 'satellite-to-pillar' | 'pillar-to-satellite'
}

/**
 * Detects missing structural links required by the topic cluster model.
 * Uses an injectable `readFile` function for testability.
 */
export function getMissingClusterLinks(
  clusters: ClusterMap,
  readFile: (filePath: string) => string,
): MissingClusterLink[] {
  const missing: MissingClusterLink[] = []

  for (const { pillar, satellites } of clusters.values()) {
    const pillarBody = readFile(pillar.filePath)

    for (const satellite of satellites) {
      const satelliteBody = readFile(satellite.filePath)

      // Rule 1: satellite → pillar
      if (!satelliteBody.includes(`(${pillar.url})`)) {
        missing.push({ source: satellite, target: pillar, linkType: 'satellite-to-pillar' })
      }

      // Rule 2: pillar → satellite
      if (!pillarBody.includes(`(${satellite.url})`)) {
        missing.push({ source: pillar, target: satellite, linkType: 'pillar-to-satellite' })
      }
    }
  }

  return missing
}

export interface ClusterSummary {
  pillarSlug: string
  pillarTitle: string
  locale: string
  satelliteCount: number
  missingLinks: MissingClusterLink[]
  health: 'healthy' | 'missing-links' | 'no-satellites'
}

/**
 * Returns a human-readable health summary for every cluster.
 */
export function getClusterSummaries(
  clusters: ClusterMap,
  readFile: (filePath: string) => string,
): ClusterSummary[] {
  const allMissing = getMissingClusterLinks(clusters, readFile)

  // Index missing links by pillar slug for O(1) lookup
  const missingByPillar = new Map<string, MissingClusterLink[]>()
  for (const link of allMissing) {
    const pillarSlug =
      link.source.contentRole === 'pillar' ? link.source.slug : link.target.slug
    if (!missingByPillar.has(pillarSlug)) missingByPillar.set(pillarSlug, [])
    missingByPillar.get(pillarSlug)!.push(link)
  }

  return Array.from(clusters.entries()).map(([slug, { pillar, satellites }]) => {
    const clusterMissing = missingByPillar.get(slug) ?? []
    let health: ClusterSummary['health']
    if (satellites.length === 0) {
      health = 'no-satellites'
    } else if (clusterMissing.length === 0) {
      health = 'healthy'
    } else {
      health = 'missing-links'
    }
    return {
      pillarSlug: slug,
      pillarTitle: pillar.title,
      locale: pillar.idioma,
      satelliteCount: satellites.length,
      missingLinks: clusterMissing,
      health,
    }
  })
}
