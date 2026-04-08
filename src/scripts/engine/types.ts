export type Locale = 'es' | 'en'

export type CandidateSource = 'keywords_backlog' | 'content_plan'

export interface NormalizedStrategyRow {
  keyword: string
  targetUrl: string
  locale: Locale
  category: string
  slug: string
  volume: number
  difficulty: number
  status: string
  clusterType?: string
  source: CandidateSource
}

export interface GapCandidate {
  locale: Locale
  category: string
  slug: string
  targetUrl: string
  source: CandidateSource
}

export interface KeywordPoolItem {
  keyword: string
  locale: Locale
  category: string
  slug: string
  targetUrl: string
  volume: number
  difficulty: number
  status: string
  clusterType?: string
  source: CandidateSource
}

export interface KeywordAssignment {
  gap: GapCandidate
  keyword: string
  targetUrl: string
  score: number
  source: CandidateSource
}

export interface GapAnalyzerInput {
  strategyRows: readonly NormalizedStrategyRow[]
  existingPostKeys: ReadonlySet<string>
}

export interface AssignmentInput {
  gaps: readonly GapCandidate[]
  keywordPool: readonly KeywordPoolItem[]
}

export interface DraftMetadata {
  title: string
  metaTitle: string
  metaDescription: string
}

export interface DraftOutput {
  assignment: KeywordAssignment
  metadata: DraftMetadata
}

export interface MetadataStatus {
  slug: string
  valid: boolean
  repaired: boolean
  issues: string[]
  metadata: DraftMetadata
}
