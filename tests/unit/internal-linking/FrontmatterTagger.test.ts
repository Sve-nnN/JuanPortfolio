import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import matter from 'gray-matter'
import { FrontmatterTagger } from '../../../src/scripts/internal-linking/FrontmatterTagger'

const tmpDir = path.join(os.tmpdir(), 'fm-tagger-test-' + Date.now())

beforeEach(() => fs.mkdirSync(tmpDir, { recursive: true }))
afterEach(() => fs.rmSync(tmpDir, { recursive: true, force: true }))

// ---- inferRole ----

describe('FrontmatterTagger.inferRole', () => {
  const tagger = new FrontmatterTagger()

  it('returns "pillar" for a body with 3000+ words', () => {
    const longBody = 'word '.repeat(3001)
    expect(tagger.inferRole(longBody, {})).toBe('pillar')
  })

  it('returns "pillar" for title matching guide patterns (en)', () => {
    expect(tagger.inferRole('short', { title: 'The Complete Guide to SEO' })).toBe('pillar')
    expect(tagger.inferRole('short', { title: 'Ultimate Guide for Beginners' })).toBe('pillar')
    expect(tagger.inferRole('short', { title: 'Everything About Content Marketing' })).toBe('pillar')
  })

  it('returns "pillar" for title matching guide patterns (es)', () => {
    expect(tagger.inferRole('short', { title: 'Guía Definitiva de SEO' })).toBe('pillar')
    expect(tagger.inferRole('short', { title: 'Guía Completa de Keyword Research' })).toBe('pillar')
    expect(tagger.inferRole('short', { title: 'Manual de SEO Técnico' })).toBe('pillar')
  })

  it('returns "pillar" when legacy clusterType is "Pillar"', () => {
    expect(tagger.inferRole('short', { clusterType: 'Pillar' })).toBe('pillar')
  })

  it('returns "satellite" for a short, regular post', () => {
    expect(tagger.inferRole('short content about seo tips', {})).toBe('satellite')
  })

  it('does NOT override an existing contentRole even if heuristics disagree', () => {
    const longBody = 'word '.repeat(3001)
    expect(tagger.inferRole(longBody, { contentRole: 'satellite' })).toBe('satellite')
    expect(tagger.inferRole('short', { contentRole: 'pillar' })).toBe('pillar')
  })
})

// ---- tagFile ----

describe('FrontmatterTagger.tagFile', () => {
  it('adds contentRole to frontmatter when absent', () => {
    const content = '---\ntitle: Short Article\nidioma: es\n---\nContent here'
    const filePath = path.join(tmpDir, 'article.md')
    fs.writeFileSync(filePath, content)

    new FrontmatterTagger().tagFile(filePath)

    const updated = matter(fs.readFileSync(filePath, 'utf-8'))
    expect(updated.data.contentRole).toBeDefined()
    expect(['pillar', 'satellite', 'standalone']).toContain(updated.data.contentRole)
  })

  it('does not overwrite an existing contentRole', () => {
    const content = '---\ntitle: My Pillar\ncontentRole: pillar\n---\nContent'
    const filePath = path.join(tmpDir, 'pillar.md')
    fs.writeFileSync(filePath, content)

    new FrontmatterTagger().tagFile(filePath)

    const updated = matter(fs.readFileSync(filePath, 'utf-8'))
    expect(updated.data.contentRole).toBe('pillar')
  })

  it('adds pillarSlug when a single matching pillar is provided', () => {
    const content = '---\ntitle: SEO Tips\nidioma: es\n---\nContent'
    const filePath = path.join(tmpDir, 'seo-tips.md')
    fs.writeFileSync(filePath, content)

    new FrontmatterTagger().tagFile(filePath, { forcePillarSlug: 'guia-seo' })

    const updated = matter(fs.readFileSync(filePath, 'utf-8'))
    expect(updated.data.pillarSlug).toBe('guia-seo')
  })

  it('does not modify files that already have both contentRole and pillarSlug', () => {
    const original = '---\ntitle: Tips\ncontentRole: satellite\npillarSlug: seo-guide\n---\nContent'
    const filePath = path.join(tmpDir, 'tips.md')
    fs.writeFileSync(filePath, original)
    const before = fs.statSync(filePath).mtimeMs

    new FrontmatterTagger().tagFile(filePath)

    // File should not have been rewritten (mtime unchanged on same-content write)
    const updated = matter(fs.readFileSync(filePath, 'utf-8'))
    expect(updated.data.contentRole).toBe('satellite')
    expect(updated.data.pillarSlug).toBe('seo-guide')
  })
})

// ---- tagDirectory ----

describe('FrontmatterTagger.tagDirectory', () => {
  it('tags all .md files in a directory recursively', () => {
    const subdir = path.join(tmpDir, 'sub')
    fs.mkdirSync(subdir)
    fs.writeFileSync(path.join(tmpDir, 'post1.md'), '---\ntitle: Post 1\n---\nContent')
    fs.writeFileSync(path.join(subdir, 'post2.md'), '---\ntitle: Post 2\n---\nContent')

    new FrontmatterTagger().tagDirectory(tmpDir)

    const p1 = matter(fs.readFileSync(path.join(tmpDir, 'post1.md'), 'utf-8'))
    const p2 = matter(fs.readFileSync(path.join(subdir, 'post2.md'), 'utf-8'))
    expect(p1.data.contentRole).toBeDefined()
    expect(p2.data.contentRole).toBeDefined()
  })
})
