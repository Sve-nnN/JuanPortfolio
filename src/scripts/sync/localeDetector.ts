import path from 'path'
import type { Locale } from './types'

/**
 * Detects the locale for a content file using a two-step strategy:
 * 1. Filename suffix convention (.en.md → 'en', .es.md → 'es') — takes precedence.
 * 2. Frontmatter `idioma` field — used when no locale suffix is present.
 * 3. Falls back to 'es' (the default locale for this site).
 */
export function detectLocale(filePath: string, frontmatterLocale?: Locale): Locale {
  const filename = path.basename(filePath)
  if (filename.endsWith('.en.md')) return 'en'
  if (filename.endsWith('.es.md')) return 'es'
  return frontmatterLocale ?? 'es'
}

/**
 * Extracts the base slug from a filename, stripping locale suffixes and extension.
 * e.g. "development/nextjs-portfolio.en.md" → "nextjs-portfolio"
 */
export function getBaseSlug(filePath: string): string {
  const filename = path.basename(filePath)
  return filename.replace(/\.(en|es)\.md$/, '').replace(/\.md$/, '')
}

/**
 * Returns true for any Markdown content file (.md, .en.md, .es.md).
 */
export function isMdFile(filePath: string): boolean {
  return filePath.endsWith('.md')
}
