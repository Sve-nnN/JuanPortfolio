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

/** pillarSlug (locale:slug) → TopicCluster */
export type ClusterMap = Map<string, TopicCluster>

/**
 * Builds a map of topic clusters from a flat list of posts.
 * Satellites are attached to their declared pillar via `pillarSlug`.
 * Key is formatted as `locale:slug` to prevent cross-language collisions.
 */
export function buildClusterMap(posts: PostMetadata[]): ClusterMap {
  const map: ClusterMap = new Map()

  // First pass: register all pillar pages
  for (const post of posts) {
    if (post.contentRole === 'pillar') {
      const key = `${post.idioma}:${post.slug}`
      if (!map.has(key)) {
        map.set(key, { pillar: post, satellites: [] })
      }
    }
  }

  // Second pass: attach satellites to their declared pillar
  for (const post of posts) {
    if (post.contentRole === 'satellite' && post.pillarSlug) {
      const key = `${post.idioma}:${post.pillarSlug}`
      const cluster = map.get(key)
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

  // Index missing links by pillar cluster key (locale:slug) for O(1) lookup
  const missingByPillarKey = new Map<string, MissingClusterLink[]>()
  for (const link of allMissing) {
    const pillar = link.linkType === 'satellite-to-pillar' ? link.target : link.source
    const pillarKey = `${pillar.idioma}:${pillar.slug}`
    if (!missingByPillarKey.has(pillarKey)) missingByPillarKey.set(pillarKey, [])
    missingByPillarKey.get(pillarKey)!.push(link)
  }

  return Array.from(clusters.entries()).map(([clusterKey, { pillar, satellites }]) => {
    const clusterMissing = missingByPillarKey.get(clusterKey) ?? []
    let health: ClusterSummary['health']
    if (satellites.length === 0) {
      health = 'no-satellites'
    } else if (clusterMissing.length === 0) {
      health = 'healthy'
    } else {
      health = 'missing-links'
    }
    return {
      pillarSlug: pillar.slug,
      pillarTitle: pillar.title,
      locale: pillar.idioma,
      satelliteCount: satellites.length,
      missingLinks: clusterMissing,
      health,
    }
  })
}
