import { type GapAnalyzerInput, type GapCandidate } from './types'

function keyOf(locale: string, category: string, slug: string): string {
  return `${locale}:${category}:${slug}`
}

export function analyzeGaps(input: GapAnalyzerInput): GapCandidate[] {
  const unique = new Map<string, GapCandidate>()

  for (const row of input.strategyRows) {
    if (!row.targetUrl || !row.slug || !row.category) {
      continue
    }

    const postKey = keyOf(row.locale, row.category, row.slug)
    if (input.existingPostKeys.has(postKey)) {
      continue
    }

    if (!unique.has(postKey)) {
      unique.set(postKey, {
        locale: row.locale,
        category: row.category,
        slug: row.slug,
        targetUrl: row.targetUrl,
        source: row.source,
      })
    }
  }

  return [...unique.values()].sort((a, b) => {
    if (a.locale !== b.locale) {
      return a.locale.localeCompare(b.locale)
    }
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category)
    }
    return a.slug.localeCompare(b.slug)
  })
}

export function buildExistingPostKey(locale: string, category: string, slug: string): string {
  return keyOf(locale, category, slug)
}
