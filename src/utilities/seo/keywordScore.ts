/**
 * Shared, dependency-light types for the Yoast-style keyword scoring engine.
 *
 * IMPORTANT: this file MUST NOT import any heavy runtime dependency (e.g.
 * `natural`). It is imported by BOTH the server-side analyzer
 * (`seoAnalyzer.ts`) and the client sidebar component (plan 22-2) so the NLP
 * stemmer never ships in the admin bundle.
 */

export type CheckState = 'green' | 'amber' | 'red'

export type KeywordCheckId =
  | 'title'
  | 'metaDescription'
  | 'h1'
  | 'slug'
  | 'density'
  | 'firstParagraph'
  | 'subheadings'

export interface Bilingual {
  es: string
  en: string
}

export interface KeywordCheck {
  id: KeywordCheckId
  state: CheckState
  label: Bilingual
  /** Actionable feedback, present only on amber/red checks. */
  feedback?: Bilingual
}

export interface KeywordScoreResult {
  checks: KeywordCheck[]
  /** Weighted 0-100 score (integer). */
  score: number
  /** Badge color derived from `score` via the LOCKED thresholds. */
  scoreColor: CheckState
  /** Number of checks in the green state. */
  passCount: number
}

/** Fixed render order of the 7 checks (matches the UI-SPEC wireframe). */
export const CHECK_ORDER: KeywordCheckId[] = [
  'title',
  'metaDescription',
  'h1',
  'slug',
  'density',
  'firstParagraph',
  'subheadings',
]

/** Bilingual labels per the UI-SPEC Copywriting Contract. */
export const CHECK_LABELS: Record<KeywordCheckId, Bilingual> = {
  title: { es: 'Keyword en el título', en: 'Keyword in title' },
  metaDescription: {
    es: 'Keyword en la meta descripción',
    en: 'Keyword in meta description',
  },
  h1: { es: 'Keyword en el H1', en: 'Keyword in H1' },
  slug: { es: 'Keyword en el slug', en: 'Keyword in slug' },
  density: { es: 'Densidad en el contenido', en: 'Density in content' },
  firstParagraph: {
    es: 'Keyword en el primer párrafo',
    en: 'Keyword in first paragraph',
  },
  subheadings: { es: 'Keyword en subtítulos', en: 'Keyword in subheadings' },
}

/**
 * Weights per check (sum = 100). Title/meta/H1 weigh more than
 * density/first-paragraph/subheadings, Yoast-style.
 */
export const CHECK_WEIGHTS: Record<KeywordCheckId, number> = {
  title: 20,
  metaDescription: 15,
  h1: 20,
  slug: 10,
  density: 15,
  firstParagraph: 10,
  subheadings: 10,
}

/** Target keyword density range for the body (percent). */
export const DENSITY_MIN = 0.5
export const DENSITY_MAX = 2.5

/**
 * Map a 0-100 score to a badge color.
 * LOCKED thresholds (UI-SPEC): green >= 80, amber 50-79, red < 50.
 * These never change regardless of the check weights.
 */
export function scoreToColor(score: number): CheckState {
  if (score >= 80) return 'green'
  if (score >= 50) return 'amber'
  return 'red'
}
