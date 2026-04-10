import { type AssignmentInput, type KeywordAssignment, type KeywordPoolItem } from './types'

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase()
}

function isAssignable(status: string): boolean {
  if (!status.trim()) {
    return true
  }
  const normalized = normalizeStatus(status)
  if (normalized === '-' || normalized === 'pendiente' || normalized === 'pending') {
    return true
  }
  return !normalized.startsWith('live')
}

function scoreKeyword(item: KeywordPoolItem): number {
  return item.volume * 2 - item.difficulty
}

export function assignKeywords(input: AssignmentInput): KeywordAssignment[] {
  const consumedKeywords = new Set<string>()
  const assignments: KeywordAssignment[] = []

  const orderedGaps = [...input.gaps].sort((a, b) => {
    if (a.locale !== b.locale) {
      return a.locale.localeCompare(b.locale)
    }
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category)
    }
    return a.slug.localeCompare(b.slug)
  })

  for (const gap of orderedGaps) {
    const candidates = input.keywordPool
      .filter((item) => item.locale === gap.locale)
      .filter((item) => item.category === gap.category)
      .filter((item) => isAssignable(item.status))
      .filter((item) => !consumedKeywords.has(item.keyword))
      .sort((a, b) => {
        const bySlugExact = Number(b.slug === gap.slug) - Number(a.slug === gap.slug)
        if (bySlugExact !== 0) {
          return bySlugExact
        }

        const scoreDiff = scoreKeyword(b) - scoreKeyword(a)
        if (scoreDiff !== 0) {
          return scoreDiff
        }

        return a.keyword.localeCompare(b.keyword)
      })

    const selected = candidates[0]
    if (!selected) {
      continue
    }

    consumedKeywords.add(selected.keyword)
    assignments.push({
      gap,
      keyword: selected.keyword,
      targetUrl: selected.targetUrl,
      score: scoreKeyword(selected),
      source: selected.source,
    })
  }

  return assignments
}
