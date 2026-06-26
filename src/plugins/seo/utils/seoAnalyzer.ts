/**
 * SEO Analyzer - Analyzes content and provides SEO recommendations
 * Similar to Rank Math's content analysis
 */
// `natural` is a CommonJS module with no ESM named-export interop. Importing it
// as a default (CJS namespace) keeps it loadable under every consumer: Next's
// webpack bundle, Vitest/Vite, AND the tsx ESM script runner (audit:keywords).
// A named import (`import { PorterStemmer } from 'natural'`) throws
// "does not provide an export named 'PorterStemmer'" under tsx.
import natural, { type Stemmer } from 'natural'

const { PorterStemmer, PorterStemmerEs } = natural
import {
  CHECK_LABELS,
  CHECK_ORDER,
  CHECK_WEIGHTS,
  DENSITY_MAX,
  DENSITY_MIN,
  scoreToColor,
  type Bilingual,
  type CheckState,
  type KeywordCheck,
  type KeywordCheckId,
  type KeywordScoreResult,
} from '../types/keywordScore'

export interface SEOAnalysisInput {
  title?: string
  content?: unknown
  meta?: {
    title?: string
    description?: string
    keywords?: string
  }
  slug?: string
}

export interface SEOIssue {
  type: 'error' | 'warning' | 'success' | 'info'
  category: string
  message: string
  score: number
}

export interface SEOAnalysisResult {
  score: number
  issues: SEOIssue[]
  suggestions: string[]
  metrics: {
    titleLength: number
    descriptionLength: number
    headingsCount: Record<string, number>
    wordCount: number
    readabilityScore: number
    keywordDensity: Record<string, number>
    internalLinksCount: number
    externalLinksCount: number
    imagesCount: number
    imagesWithoutAlt: number
  }
}

export async function analyzeSEO(input: SEOAnalysisInput): Promise<SEOAnalysisResult> {
  const issues: SEOIssue[] = []
  const suggestions: string[] = []
  let totalScore = 100

  // Extract text content
  const contentText = extractText(input.content)
  const wordCount = countWords(contentText)
  const headings = extractHeadings(input.content)

  // Analyze meta title
  const metaTitle = input.meta?.title || input.title || ''
  const titleLength = metaTitle.length

  if (!metaTitle) {
    issues.push({
      type: 'error',
      category: 'Title',
      message: 'Meta title is missing',
      score: -15,
    })
    totalScore -= 15
    suggestions.push('Add a compelling meta title (50-60 characters)')
  } else if (titleLength < 30) {
    issues.push({
      type: 'warning',
      category: 'Title',
      message: `Meta title is too short (${titleLength} chars). Recommended: 50-60 characters.`,
      score: -5,
    })
    totalScore -= 5
  } else if (titleLength > 60) {
    issues.push({
      type: 'warning',
      category: 'Title',
      message: `Meta title is too long (${titleLength} chars). It may be truncated in search results.`,
      score: -5,
    })
    totalScore -= 5
  } else {
    issues.push({
      type: 'success',
      category: 'Title',
      message: `Meta title length is optimal (${titleLength} chars)`,
      score: 0,
    })
  }

  // Analyze meta description
  const metaDescription = input.meta?.description || ''
  const descriptionLength = metaDescription.length

  if (!metaDescription) {
    issues.push({
      type: 'error',
      category: 'Description',
      message: 'Meta description is missing',
      score: -15,
    })
    totalScore -= 15
    suggestions.push('Add a compelling meta description (150-160 characters)')
  } else if (descriptionLength < 120) {
    issues.push({
      type: 'warning',
      category: 'Description',
      message: `Meta description is too short (${descriptionLength} chars). Recommended: 150-160 characters.`,
      score: -5,
    })
    totalScore -= 5
  } else if (descriptionLength > 160) {
    issues.push({
      type: 'warning',
      category: 'Description',
      message: `Meta description is too long (${descriptionLength} chars). It may be truncated.`,
      score: -5,
    })
    totalScore -= 5
  } else {
    issues.push({
      type: 'success',
      category: 'Description',
      message: `Meta description length is optimal (${descriptionLength} chars)`,
      score: 0,
    })
  }

  // Analyze content length
  if (wordCount === 0) {
    issues.push({
      type: 'error',
      category: 'Content',
      message: 'No content found',
      score: -20,
    })
    totalScore -= 20
  } else if (wordCount < 300) {
    issues.push({
      type: 'warning',
      category: 'Content',
      message: `Content is too short (${wordCount} words). Aim for at least 300 words.`,
      score: -10,
    })
    totalScore -= 10
    suggestions.push('Add more content. Search engines prefer comprehensive content (300+ words)')
  } else if (wordCount >= 300 && wordCount < 600) {
    issues.push({
      type: 'info',
      category: 'Content',
      message: `Content length is good (${wordCount} words)`,
      score: 0,
    })
  } else {
    issues.push({
      type: 'success',
      category: 'Content',
      message: `Excellent content length (${wordCount} words)`,
      score: 0,
    })
  }

  // Analyze heading structure
  const h1Count = headings.h1 || 0
  const h2Count = headings.h2 || 0

  if (h1Count === 0) {
    issues.push({
      type: 'error',
      category: 'Headings',
      message: 'No H1 heading found',
      score: -10,
    })
    totalScore -= 10
    suggestions.push('Add an H1 heading to your content')
  } else if (h1Count > 1) {
    issues.push({
      type: 'warning',
      category: 'Headings',
      message: `Multiple H1 headings found (${h1Count}). Use only one H1 per page.`,
      score: -5,
    })
    totalScore -= 5
  } else {
    issues.push({
      type: 'success',
      category: 'Headings',
      message: 'H1 heading structure is correct',
      score: 0,
    })
  }

  if (h2Count === 0 && wordCount > 300) {
    issues.push({
      type: 'warning',
      category: 'Headings',
      message: 'No H2 headings found. Use subheadings to structure your content.',
      score: -5,
    })
    totalScore -= 5
    suggestions.push('Add H2 subheadings to improve content structure and readability')
  } else if (h2Count > 0) {
    issues.push({
      type: 'success',
      category: 'Headings',
      message: `Good use of subheadings (${h2Count} H2 headings)`,
      score: 0,
    })
  }

  // Analyze focus keywords
  const keywords = input.meta?.keywords?.split(',').map((k) => k.trim().toLowerCase()) || []
  const keywordDensity: Record<string, number> = {}

  if (keywords.length === 0) {
    issues.push({
      type: 'warning',
      category: 'Keywords',
      message: 'No focus keywords defined',
      score: -5,
    })
    totalScore -= 5
    suggestions.push('Define 1-3 focus keywords for this content')
  } else {
    const contentLower = contentText.toLowerCase()
    const titleLower = metaTitle.toLowerCase()

    keywords.forEach((keyword) => {
      if (!keyword) return

      // Calculate keyword density
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'gi')
      const matches = contentText.match(regex) || []
      const density = wordCount > 0 ? (matches.length / wordCount) * 100 : 0
      keywordDensity[keyword] = parseFloat(density.toFixed(2))

      // Check if keyword is in title
      if (!titleLower.includes(keyword)) {
        issues.push({
          type: 'warning',
          category: 'Keywords',
          message: `Focus keyword "${keyword}" not found in meta title`,
          score: -3,
        })
        totalScore -= 3
        suggestions.push(`Include "${keyword}" in your meta title`)
      }

      // Check if keyword is in content
      if (!contentLower.includes(keyword)) {
        issues.push({
          type: 'warning',
          category: 'Keywords',
          message: `Focus keyword "${keyword}" not found in content`,
          score: -5,
        })
        totalScore -= 5
        suggestions.push(`Include "${keyword}" naturally in your content`)
      } else {
        // Check keyword density
        if (density < 0.5) {
          issues.push({
            type: 'info',
            category: 'Keywords',
            message: `Keyword "${keyword}" density is low (${density}%). Consider using it more.`,
            score: 0,
          })
        } else if (density > 3) {
          issues.push({
            type: 'warning',
            category: 'Keywords',
            message: `Keyword "${keyword}" density is too high (${density}%). Avoid keyword stuffing.`,
            score: -5,
          })
          totalScore -= 5
        } else {
          issues.push({
            type: 'success',
            category: 'Keywords',
            message: `Keyword "${keyword}" density is optimal (${density}%)`,
            score: 0,
          })
        }
      }
    })
  }

  // Analyze URL/slug
  if (input.slug) {
    const slugLength = input.slug.length
    if (slugLength > 75) {
      issues.push({
        type: 'warning',
        category: 'URL',
        message: `URL slug is too long (${slugLength} chars). Keep it under 75 characters.`,
        score: -3,
      })
      totalScore -= 3
    }

    // Check if keywords are in slug
    if (
      keywords.length > 0 &&
      !keywords.some((k) => input.slug?.includes(k.replace(/\s+/g, '-')))
    ) {
      issues.push({
        type: 'info',
        category: 'URL',
        message: 'Focus keyword not found in URL. Consider including it for better SEO.',
        score: 0,
      })
      suggestions.push('Include your focus keyword in the URL slug')
    }
  }

  // Calculate readability score (Flesch Reading Ease approximation)
  const readabilityScore = calculateReadability(contentText, wordCount)

  if (readabilityScore < 30) {
    issues.push({
      type: 'warning',
      category: 'Readability',
      message: 'Content is difficult to read. Consider simplifying your language.',
      score: -5,
    })
    totalScore -= 5
    suggestions.push('Use shorter sentences and simpler words to improve readability')
  } else if (readabilityScore < 50) {
    issues.push({
      type: 'info',
      category: 'Readability',
      message: 'Content readability is moderate',
      score: 0,
    })
  } else {
    issues.push({
      type: 'success',
      category: 'Readability',
      message: 'Content is easy to read',
      score: 0,
    })
  }

  // Ensure score is between 0 and 100
  totalScore = Math.max(0, Math.min(100, totalScore))

  return {
    score: Math.round(totalScore),
    issues,
    suggestions,
    metrics: {
      titleLength,
      descriptionLength,
      headingsCount: headings,
      wordCount,
      readabilityScore: Math.round(readabilityScore),
      keywordDensity,
      internalLinksCount: 0, // TODO: Implement link counting
      externalLinksCount: 0,
      imagesCount: 0,
      imagesWithoutAlt: 0,
    },
  }
}

/**
 * Extract plain text from Lexical content.
 *
 * Robust to arbitrary nesting: it follows `root`/`children`/`text` (Posts
 * single richText) AND recurses into every array element and object value, so
 * Pages `layout` blocks — where richText lives inside arbitrary block-field
 * properties — are also fully traversed. Structural string fields like
 * `blockType`/`type`/`tag` are never collected (only `text` nodes are).
 */
export function extractText(content: unknown): string {
  if (!content) return ''

  let text = ''
  const seen = new WeakSet<object>()

  function traverse(node: unknown): void {
    if (!node || typeof node !== 'object') return
    if (seen.has(node)) return
    seen.add(node)

    if (Array.isArray(node)) {
      node.forEach(traverse)
      return
    }

    const obj = node as Record<string, unknown>

    if (typeof obj.text === 'string') {
      text += obj.text + ' '
    }

    for (const [key, value] of Object.entries(obj)) {
      if (key === 'text') continue
      if (value && typeof value === 'object') traverse(value)
    }
  }

  traverse(content)

  return text.trim().replace(/\s+/g, ' ')
}

/**
 * Extract heading nodes (level + text) from Lexical content or Pages blocks.
 */
export function extractHeadingNodes(content: unknown): Array<{ level: number; text: string }> {
  const out: Array<{ level: number; text: string }> = []
  const seen = new WeakSet<object>()

  function traverse(node: unknown): void {
    if (!node || typeof node !== 'object') return
    if (seen.has(node)) return
    seen.add(node)

    if (Array.isArray(node)) {
      node.forEach(traverse)
      return
    }

    const obj = node as Record<string, unknown>
    const tag = typeof obj.tag === 'string' ? obj.tag : ''
    const isHeading = obj.type === 'heading' || /^h[1-6]$/i.test(tag)

    if (isHeading) {
      let level = 2
      const m = tag.match(/^h([1-6])$/i)
      if (m) level = parseInt(m[1], 10)
      out.push({ level, text: extractText(obj.children ?? obj) })
    }

    for (const [key, value] of Object.entries(obj)) {
      if (key === 'text') continue
      if (value && typeof value === 'object') traverse(value)
    }
  }

  traverse(content)

  return out
}

/**
 * Extract paragraph (and standalone text block) strings, in document order.
 * Handles both Posts richText and Pages `layout` blocks.
 */
export function extractParagraphs(content: unknown): string[] {
  const out: string[] = []
  const seen = new WeakSet<object>()

  function traverse(node: unknown): void {
    if (!node || typeof node !== 'object') return
    if (seen.has(node)) return
    seen.add(node)

    if (Array.isArray(node)) {
      node.forEach(traverse)
      return
    }

    const obj = node as Record<string, unknown>

    if (obj.type === 'paragraph') {
      const t = extractText(obj.children ?? obj).trim()
      if (t) out.push(t)
      return
    }

    for (const [key, value] of Object.entries(obj)) {
      if (key === 'text') continue
      if (value && typeof value === 'object') traverse(value)
    }
  }

  traverse(content)

  return out
}

/**
 * Extract headings from Lexical content / Pages blocks, counted by tag.
 */
export function extractHeadings(content: unknown): Record<string, number> {
  const headings: Record<string, number> = {}
  for (const h of extractHeadingNodes(content)) {
    const tag = `h${h.level}`
    headings[tag] = (headings[tag] || 0) + 1
  }
  return headings
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Calculate readability score (simplified Flesch Reading Ease)
 */
function calculateReadability(text: string, wordCount: number): number {
  if (!text || wordCount === 0) return 0

  const sentences = text.split(/[.!?]+/).filter(Boolean).length
  const syllables = countSyllables(text)

  if (sentences === 0) return 0

  // Flesch Reading Ease formula
  const score = 206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / wordCount)

  return Math.max(0, Math.min(100, score))
}

/**
 * Count syllables in text (approximation)
 */
function countSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/)
  let count = 0

  words.forEach((word) => {
    const matches = word.match(/[aeiouy]{1,2}/g)
    count += matches ? matches.length : 1
  })

  return count
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ===========================================================================
// Yoast-style keyword scoring (SCORE-01/02/03)
// ===========================================================================

export interface KeywordAnalysisInput {
  keyword: string
  title?: string
  meta?: { title?: string; description?: string }
  slug?: string
  content?: unknown
  locale?: 'es' | 'en'
}

function getStemmer(locale?: string): Stemmer {
  return locale === 'es' ? PorterStemmerEs : PorterStemmer
}

/** Lowercase + split on any non-letter/non-number (handles hyphens & punctuation). */
function tokenize(text: string): string[] {
  if (!text) return []
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
}

function stemTokens(tokens: string[], locale?: string): string[] {
  const stemmer = getStemmer(locale)
  return tokens.map((t) => stemmer.stem(t))
}

/**
 * Index of the first contiguous occurrence of `seq` within `tokens`, or -1.
 * This is the single matching primitive shared by ALL checks (M1-02): every
 * check requires the keyword's stemmed tokens to appear as a contiguous phrase,
 * so multi-word keywords ("core web vitals") cannot produce contradictory
 * results between the presence checks and the density check.
 */
function sequenceIndex(tokens: string[], seq: string[]): number {
  if (seq.length === 0 || tokens.length < seq.length) return -1
  for (let i = 0; i <= tokens.length - seq.length; i++) {
    let ok = true
    for (let j = 0; j < seq.length; j++) {
      if (tokens[i + j] !== seq[j]) {
        ok = false
        break
      }
    }
    if (ok) return i
  }
  return -1
}

/** Count contiguous occurrences of the keyword token sequence within a token list. */
function countSequence(tokens: string[], seq: string[]): number {
  if (seq.length === 0 || tokens.length < seq.length) return 0
  let count = 0
  for (let i = 0; i <= tokens.length - seq.length; i++) {
    let ok = true
    for (let j = 0; j < seq.length; j++) {
      if (tokens[i + j] !== seq[j]) {
        ok = false
        break
      }
    }
    if (ok) count++
  }
  return count
}

/**
 * True when the keyword's stemmed token sequence appears as a contiguous
 * phrase anywhere in the haystack. Consistent phrase semantics across every
 * check (title/meta/H1/slug/first-paragraph/subheadings + density).
 */
function keywordPhraseIn(haystack: string, kwTokens: string[], locale?: string): boolean {
  if (kwTokens.length === 0) return false
  return sequenceIndex(stemTokens(tokenize(haystack), locale), kwTokens) >= 0
}

function makeCheck(id: KeywordCheckId, state: CheckState, feedback?: Bilingual): KeywordCheck {
  return feedback && state !== 'green'
    ? { id, state, label: CHECK_LABELS[id], feedback }
    : { id, state, label: CHECK_LABELS[id] }
}

/** Format a percentage with es (comma) / en (dot) decimals. */
function fmtPct(value: number): Bilingual {
  const en = value.toFixed(1)
  return { es: en.replace('.', ','), en }
}

const RED_FEEDBACK: Record<KeywordCheckId, Bilingual> = {
  title: {
    es: 'La keyword no está en el título. Agregala, idealmente al inicio.',
    en: 'The keyword is missing from the title. Add it, ideally near the start.',
  },
  metaDescription: {
    es: 'La keyword no está en la meta descripción. Inclúyela una vez.',
    en: 'The keyword is missing from the meta description. Include it once.',
  },
  h1: {
    es: 'La keyword no aparece en el H1. Usala en el encabezado principal.',
    en: 'The keyword is missing from the H1. Use it in the main heading.',
  },
  slug: {
    es: 'La keyword no está en el slug. Ajustá la URL para incluirla.',
    en: 'The keyword is missing from the slug. Adjust the URL to include it.',
  },
  density: {
    es: 'La keyword no aparece en el cuerpo. Mencionala en el contenido.',
    en: "The keyword doesn't appear in the body. Mention it in the content.",
  },
  firstParagraph: {
    es: 'La keyword no está en el primer párrafo. Mencionala al inicio.',
    en: 'The keyword is missing from the first paragraph. Mention it at the start.',
  },
  subheadings: {
    es: 'La keyword no aparece en ningún subtítulo (H2-H4). Agregala a uno.',
    en: "The keyword doesn't appear in any subheading (H2-H4). Add it to one.",
  },
}

/** Distinct feedback for a genuinely missing H1 (no fallback to the title). */
const H1_MISSING_FEEDBACK: Bilingual = {
  es: 'No se encontró un H1 en el contenido. Agregá un encabezado H1 con la keyword.',
  en: 'No H1 found in the content. Add an H1 heading containing the keyword.',
}

/**
 * Pure analyzer: runs the 7 Yoast-style checks against the live editor fields
 * and returns structured results, a weighted 0-100 score and a badge color.
 *
 * Sources (per CONTEXT): title = meta.title || title; metaDescription =
 * meta.description; H1 = first H1 of content (fallback to doc title); slug;
 * density/first-paragraph/subheadings from the extracted body. Keyword
 * matching uses real es/en stemming so morphological variants match.
 */
export function analyzeKeywordChecks(
  input: KeywordAnalysisInput,
): KeywordScoreResult {
  const locale = input.locale
  const keyword = (input.keyword || '').trim()
  const kwTokens = stemTokens(tokenize(keyword), locale)

  const titleSource = input.meta?.title || input.title || ''
  const metaDescription = input.meta?.description || ''
  const slug = input.slug || ''

  const headingNodes = extractHeadingNodes(input.content)
  const paragraphs = extractParagraphs(input.content)

  // Density denominator is the paragraph body only (L3-08): heading text must
  // not inflate the word count nor count as a body occurrence.
  const bodyTokens = stemTokens(tokenize(paragraphs.join(' ')), locale)

  // No fallback to the document title (M3-04): if the content has no H1 node,
  // the H1 check reflects the missing H1 instead of masking it.
  const firstH1 = headingNodes.find((h) => h.level === 1)?.text ?? null

  const byId: Record<KeywordCheckId, KeywordCheck> = {} as Record<
    KeywordCheckId,
    KeywordCheck
  >

  // 1. Title (pass/fail)
  byId.title = keywordPhraseIn(titleSource, kwTokens, locale)
    ? makeCheck('title', 'green')
    : makeCheck('title', 'red', RED_FEEDBACK.title)

  // 2. Meta description (pass/fail)
  byId.metaDescription = keywordPhraseIn(metaDescription, kwTokens, locale)
    ? makeCheck('metaDescription', 'green')
    : makeCheck('metaDescription', 'red', RED_FEEDBACK.metaDescription)

  // 3. H1 (pass/fail) — a missing H1 can never be green.
  if (firstH1 === null) {
    byId.h1 = makeCheck('h1', 'red', H1_MISSING_FEEDBACK)
  } else {
    byId.h1 = keywordPhraseIn(firstH1, kwTokens, locale)
      ? makeCheck('h1', 'green')
      : makeCheck('h1', 'red', RED_FEEDBACK.h1)
  }

  // 4. Slug (pass/fail)
  byId.slug = keywordPhraseIn(slug, kwTokens, locale)
    ? makeCheck('slug', 'green')
    : makeCheck('slug', 'red', RED_FEEDBACK.slug)

  // 5. Density
  const occurrences = countSequence(bodyTokens, kwTokens)
  const density = bodyTokens.length > 0 ? (occurrences / bodyTokens.length) * 100 : 0
  if (occurrences === 0) {
    byId.density = makeCheck('density', 'red', RED_FEEDBACK.density)
  } else if (density >= DENSITY_MIN && density <= DENSITY_MAX) {
    byId.density = makeCheck('density', 'green')
  } else {
    const pct = fmtPct(density)
    byId.density = makeCheck('density', 'amber', {
      es: `Densidad ${pct.es}% - apuntá a 0,5-2,5%.`,
      en: `Density ${pct.en}% - aim for 0.5-2.5%.`,
    })
  }

  // 6. First paragraph
  const firstPara = paragraphs[0] || ''
  const fpTokens = stemTokens(tokenize(firstPara), locale)
  const fpIdx = sequenceIndex(fpTokens, kwTokens)
  if (fpIdx < 0) {
    byId.firstParagraph = makeCheck('firstParagraph', 'red', RED_FEEDBACK.firstParagraph)
  } else {
    const early = fpIdx < fpTokens.length / 2
    byId.firstParagraph = early
      ? makeCheck('firstParagraph', 'green')
      : makeCheck('firstParagraph', 'amber', {
          es: 'Aparece tarde en el primer párrafo. Subila más arriba.',
          en: 'It appears late in the first paragraph. Move it earlier.',
        })
  }

  // 7. Subheadings (h2-h4)
  const subs = headingNodes.filter((h) => h.level >= 2 && h.level <= 4)
  const subsWithKw = subs.filter((h) => keywordPhraseIn(h.text, kwTokens, locale))
  if (subs.length === 0 || subsWithKw.length === 0) {
    byId.subheadings = makeCheck('subheadings', 'red', RED_FEEDBACK.subheadings)
  } else if (subs.length > 1 && subsWithKw.length < subs.length / 2) {
    byId.subheadings = makeCheck('subheadings', 'amber', {
      es: 'Aparece en pocos subtítulos. Reforzá en otro H2-H4.',
      en: 'It appears in few subheadings. Reinforce it in another H2-H4.',
    })
  } else {
    byId.subheadings = makeCheck('subheadings', 'green')
  }

  // Assemble in fixed order + weighted score.
  const checks = CHECK_ORDER.map((id) => byId[id])
  let rawScore = 0
  for (const c of checks) {
    const w = CHECK_WEIGHTS[c.id]
    if (c.state === 'green') rawScore += w
    else if (c.state === 'amber') rawScore += w * 0.5
  }
  const score = Math.round(rawScore)

  return {
    checks,
    score,
    scoreColor: scoreToColor(score),
    passCount: checks.filter((c) => c.state === 'green').length,
  }
}
