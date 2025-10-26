/**
 * SEO Analyzer - Analyzes content and provides SEO recommendations
 * Similar to Rank Math's content analysis
 */

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
 * Extract plain text from Lexical content
 */
function extractText(content: unknown): string {
  if (!content) return ''

  let text = ''

  function traverse(node: unknown): void {
    if (!node) return

    if (typeof node === 'string') {
      text += node + ' '
      return
    }

    if (typeof node === 'object' && node !== null) {
      const obj = node as Record<string, unknown>

      if (obj.text && typeof obj.text === 'string') {
        text += obj.text + ' '
      }

      if (obj.children && Array.isArray(obj.children)) {
        obj.children.forEach(traverse)
      }

      if (obj.root) {
        traverse(obj.root)
      }
    }
  }

  traverse(content)

  return text.trim().replace(/\s+/g, ' ')
}

/**
 * Extract headings from Lexical content
 */
function extractHeadings(content: unknown): Record<string, number> {
  const headings: Record<string, number> = {}

  function traverse(node: unknown): void {
    if (!node || typeof node !== 'object') return

    const obj = node as Record<string, unknown>

    // Check for heading type
    if (
      obj.type === 'heading' ||
      (obj.tag && typeof obj.tag === 'string' && /^h[1-6]$/i.test(obj.tag))
    ) {
      const tag = (obj.tag as string)?.toLowerCase() || 'h2'
      headings[tag] = (headings[tag] || 0) + 1
    }

    if (Array.isArray(obj.children)) {
      obj.children.forEach(traverse)
    }

    if (obj.root) {
      traverse(obj.root)
    }
  }

  traverse(content)

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
