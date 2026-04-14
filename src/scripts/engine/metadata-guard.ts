import { type DraftMetadata } from './types'

const META_DESCRIPTION_MIN = 120
const META_DESCRIPTION_MAX = 160

export interface MetadataValidationResult {
  valid: boolean
  repaired: boolean
  issues: string[]
  metadata: DraftMetadata
}

function trimAndCollapse(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function buildFallbackDescription(metaTitle: string, keyword: string): string {
  const base = `${metaTitle} - Practical guide and implementation steps for ${keyword}.`
  if (base.length < META_DESCRIPTION_MIN) {
    return `${base} Includes examples, key takeaways, and actionable recommendations.`.slice(0, META_DESCRIPTION_MAX)
  }
  return base.slice(0, META_DESCRIPTION_MAX)
}

export function validateAndRepairMetadata(metadata: DraftMetadata, keyword: string): MetadataValidationResult {
  const issues: string[] = []
  let repaired = false

  const title = trimAndCollapse(metadata.title)
  const metaTitle = trimAndCollapse(metadata.metaTitle)
  let metaDescription = trimAndCollapse(metadata.metaDescription)

  if (!title) {
    issues.push('Missing title')
  }
  if (!metaTitle) {
    issues.push('Missing metaTitle')
  }

  if (!title || !metaTitle) {
    return {
      valid: false,
      repaired: false,
      issues,
      metadata: { title, metaTitle, metaDescription },
    }
  }

  if (!metaDescription) {
    issues.push('Missing metaDescription')
    metaDescription = buildFallbackDescription(metaTitle, keyword)
    repaired = true
  }

  if (metaDescription.length < META_DESCRIPTION_MIN || metaDescription.length > META_DESCRIPTION_MAX) {
    issues.push(`metaDescription length out of range (${metaDescription.length})`)
    metaDescription = buildFallbackDescription(metaTitle, keyword)
    repaired = true
  }

  if (metaDescription.length < META_DESCRIPTION_MIN || metaDescription.length > META_DESCRIPTION_MAX) {
    return {
      valid: false,
      repaired,
      issues,
      metadata: { title, metaTitle, metaDescription },
    }
  }

  return {
    valid: true,
    repaired,
    issues,
    metadata: { title, metaTitle, metaDescription },
  }
}

export const metadataGuardConstants = {
  META_DESCRIPTION_MIN,
  META_DESCRIPTION_MAX,
}
