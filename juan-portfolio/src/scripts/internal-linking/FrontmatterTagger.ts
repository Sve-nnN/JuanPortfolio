/**
 * FrontmatterTagger
 *
 * Reads Markdown files and tags them with `contentRole` (and optionally `pillarSlug`)
 * in their YAML frontmatter, without altering any other content.
 *
 * Inference rules (applied only when `contentRole` is absent):
 *  1. `clusterType: Pillar` in existing frontmatter → 'pillar' (legacy migration)
 *  2. Body word-count ≥ 3,000 → 'pillar'
 *  3. Title matches pillar patterns (guide / guía / complete / definitiva …) → 'pillar'
 *  4. Otherwise → 'satellite'
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { ContentRole } from './types'

const PILLAR_TITLE_PATTERN = /guía|guia|guide|manual|complete|definitiva|everything|ultimate/i
const PILLAR_WORD_THRESHOLD = 3000

export interface TagFileOptions {
  /** When provided, also writes this value as `pillarSlug` (only if not already set). */
  forcePillarSlug?: string
}

export class FrontmatterTagger {
  /**
   * Infers the content role for a post.
   * Returns the existing `contentRole` unchanged if already set.
   */
  inferRole(body: string, frontmatterData: Record<string, unknown>): ContentRole {
    // Honour existing explicit value
    const existing = frontmatterData.contentRole as ContentRole | undefined
    if (existing) return existing

    // Legacy migration
    if (frontmatterData.clusterType === 'Pillar') return 'pillar'

    // Word count heuristic
    const wordCount = body.trim().split(/\s+/).filter(Boolean).length
    if (wordCount >= PILLAR_WORD_THRESHOLD) return 'pillar'

    // Title pattern heuristic
    const title = String(frontmatterData.title ?? '')
    if (PILLAR_TITLE_PATTERN.test(title)) return 'pillar'

    return 'satellite'
  }

  /**
   * Tags a single Markdown file in-place.
   * Writes back only when the frontmatter actually changes.
   */
  tagFile(filePath: string, options: TagFileOptions = {}): void {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { data, content: body } = matter(raw)

    let changed = false

    if (!data.contentRole) {
      data.contentRole = this.inferRole(body, data)
      changed = true
    }

    if (options.forcePillarSlug && !data.pillarSlug) {
      data.pillarSlug = options.forcePillarSlug
      changed = true
    }

    if (changed) {
      const updated = matter.stringify(body, data)
      fs.writeFileSync(filePath, updated, 'utf-8')
    }
  }

  /**
   * Recursively tags all Markdown files under `dir`.
   */
  tagDirectory(dir: string, options: TagFileOptions = {}): void {
    for (const entry of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, entry)
      if (fs.statSync(fullPath).isDirectory()) {
        this.tagDirectory(fullPath, options)
      } else if (entry.endsWith('.md')) {
        try {
          this.tagFile(fullPath, options)
        } catch (err) {
          console.error(`FrontmatterTagger: failed to tag ${fullPath}:`, err)
        }
      }
    }
  }
}
