import * as path from 'path'
import type { LinkOpportunity } from '@/scripts/internal-linking/types'
import type { LinkSuggestion } from '@/types/admin/internal-links'

export function mapOpportunityToSuggestion(opp: LinkOpportunity): LinkSuggestion {
  return {
    sourceSlug: opp.sourcePost.slug,
    targetSlug: opp.targetPost.slug,
    targetTitle: opp.targetPost.title,
    targetUrl: opp.targetPost.url,
    keyword: opp.keyword,
    context: opp.context,
    lineNumber: opp.lineNumber,
    confidence: opp.relevance,
    filePath: opp.sourcePost.filePath,
    semantic: opp.semantic
      ? {
          lexicalScore: opp.semantic.lexicalScore,
          clusterScore: opp.semantic.clusterScore,
          vectorScore: opp.semantic.vectorScore,
          totalScore: opp.semantic.totalScore,
        }
      : undefined,
  }
}

export function isPathSafe(filePath: string, contentRoot: string): boolean {
  const resolved = path.resolve(filePath)
  const root = path.resolve(contentRoot)
  return resolved.startsWith(root + path.sep) || resolved.startsWith(root + '/')
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
