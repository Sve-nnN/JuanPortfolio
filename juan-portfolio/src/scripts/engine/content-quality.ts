/**
 * Content Quality Validator
 * Validates that generated content makes sense and has adequate structure
 */

export interface ContentQualityIssue {
  type: 'length' | 'structure' | 'coherence' | 'language'
  severity: 'warning' | 'error'
  message: string
}

export interface ContentQualityReport {
  valid: boolean
  issues: ContentQualityIssue[]
  score: number // 0-100
  minWordCount: number
  actualWordCount: number
  hasHeadings: boolean
  hasLists: boolean
}

const MIN_WORD_COUNT = 800 // Post should be at least 800 words
const MIN_HEADINGS = 2 // Post should have at least 2 headings

export function validateContentQuality(markdown: string, keyword: string): ContentQualityReport {
  const issues: ContentQualityIssue[] = []
  let score = 100

  // Count words
  const words = markdown.split(/\s+/).filter(w => w.length > 0)
  const wordCount = words.length

  if (wordCount < MIN_WORD_COUNT) {
    issues.push({
      type: 'length',
      severity: 'error',
      message: `Content too short (${wordCount} words). Minimum ${MIN_WORD_COUNT} words.`,
    })
    score -= 20
  }

  if (wordCount < MIN_WORD_COUNT * 1.2) {
    issues.push({
      type: 'length',
      severity: 'warning',
      message: `Content is barely above minimum length (${wordCount} words). Aim for 1500+ words.`,
    })
    score -= 5
  }

  // Check for keyword mentions
  const normalizedKeyword = keyword.toLowerCase().trim()
  const lowerContent = markdown.toLowerCase()
  const keywordMatches = lowerContent.split(normalizedKeyword).length - 1

  if (keywordMatches === 0) {
    issues.push({
      type: 'coherence',
      severity: 'error',
      message: `Keyword "${keyword}" not found in content`,
    })
    score -= 15
  } else if (keywordMatches < 3) {
    issues.push({
      type: 'coherence',
      severity: 'warning',
      message: `Keyword "${keyword}" mentioned only ${keywordMatches} times. Aim for 5+ times.`,
    })
    score -= 5
  }

  // Check structure (headings)
  const lines = markdown.split(/\r?\n/)
  const headingLines = lines.filter(l => /^#+\s/.test(l)).length
  const hasHeadings = headingLines >= MIN_HEADINGS
  const hasBulletLists = /^[\s]*[-*•]\s/.test(markdown)
  const hasNumberedLists = /^[\s]*\d+\.\s/.test(markdown)

  if (!hasHeadings) {
    issues.push({
      type: 'structure',
      severity: 'warning',
      message: `Content has only ${headingLines} headings. Aim for at least ${MIN_HEADINGS} major sections.`,
    })
    score -= 10
  }

  if (!hasBulletLists && !hasNumberedLists) {
    issues.push({
      type: 'structure',
      severity: 'warning',
      message: 'Content has no lists. Consider adding bullet points or numbered lists for clarity.',
    })
    score -= 5
  }

  // Check for code blocks (common in tech content)
  const hasCodeBlocks = /```[\s\S]*?```/.test(markdown)

  // Check for basic coherence (no massive gaps, reasonable line length)
  const averageLineLength = markdown.length / lines.filter(l => l.trim().length > 0).length
  if (averageLineLength < 20 || averageLineLength > 200) {
    issues.push({
      type: 'coherence',
      severity: 'warning',
      message: `Unusual text formatting detected (avg line: ${Math.round(averageLineLength)} chars).`,
    })
    score -= 5
  }

  // Ensure score is valid
  score = Math.max(0, Math.min(100, score))

  return {
    valid: issues.every(i => i.severity === 'warning'),
    issues,
    score,
    minWordCount: MIN_WORD_COUNT,
    actualWordCount: wordCount,
    hasHeadings,
    hasLists: hasBulletLists || hasNumberedLists,
  }
}

export function formatQualityReport(report: ContentQualityReport): string {
  const lines = [
    `Quality Score: ${report.score}/100`,
    `Word Count: ${report.actualWordCount}/${report.minWordCount}`,
    `Structure: ${report.hasHeadings ? '✓' : '✗'} headings, ${report.hasLists ? '✓' : '✗'} lists`,
  ]

  if (report.issues.length > 0) {
    lines.push('Issues:')
    for (const issue of report.issues) {
      const icon = issue.severity === 'error' ? '❌' : '⚠️'
      lines.push(`  ${icon} [${issue.type}] ${issue.message}`)
    }
  }

  return lines.join('\n')
}
