import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import { globSync } from 'glob'
import matter from 'gray-matter'
import { parseKeywordsMarkdown } from '../utils/markdownTable'
import { DinoBrainApiAdapter } from '../dinorank/DinoBrainApiAdapter'
import { analyzeGaps, buildExistingPostKey } from './gap-analyzer'
import { assignKeywords } from './keyword-assigner'
import { validateAndRepairMetadata } from './metadata-guard'
import { validateContentQuality, formatQualityReport } from './content-quality'
import {
  type DraftMetadata,
  type GapCandidate,
  type KeywordAssignment,
  type KeywordPoolItem,
  type Locale,
  type MetadataStatus,
  type NormalizedStrategyRow,
} from './types'

const CATEGORY_LABELS: Record<string, string> = {
  seo: 'SEO',
  'tech-seo': 'Tech SEO',
  development: 'Development',
  'cs-fundamentals': 'CS Fundamentals',
}

export interface PipelineOptions {
  rootDir?: string
  contentDir?: string
  postsDir?: string
  strategyFile?: string
  keywordsFile?: string
  dryRun?: boolean
  limit?: number
  locale?: Locale
  strictMetadata?: boolean
  validateContent?: boolean
  provider?: string
}

export interface PipelineResult {
  gaps: GapCandidate[]
  assignments: KeywordAssignment[]
  metadataStatus: MetadataStatus[]
  artifacts: {
    gapsPath: string
    assignmentsPath: string
  }
}

export interface PipelineDependencies {
  draftGenerator?: (assignment: KeywordAssignment, rootDir: string) => Promise<DraftMetadata>
}

function normalizeLocale(rawLanguage?: string): Locale {
  return rawLanguage?.toLowerCase() === 'en' ? 'en' : 'es'
}

function parseCategoryAndSlug(targetUrl: string): { category: string; slug: string } | null {
  if (!targetUrl.startsWith('/')) return null
  const parts = targetUrl.replace(/^\//, '').split('/').filter(Boolean)
  if (parts.length < 2) return null
  const [category, slug] = parts
  if (!category || !slug) return null
  return { category, slug }
}

function normalizeRowsFromMarkdown(markdownContent: string, source: 'keywords_backlog' | 'content_plan'): {
  strategyRows: NormalizedStrategyRow[]
  keywordPool: KeywordPoolItem[]
} {
  const { keywords } = parseKeywordsMarkdown(markdownContent)
  const strategyRows: NormalizedStrategyRow[] = []
  const keywordPool: KeywordPoolItem[] = []

  for (const row of keywords) {
    const targetUrl = row.targetURL?.trim()
    if (!targetUrl) continue

    const parsed = parseCategoryAndSlug(targetUrl)
    if (!parsed) continue

    const locale = normalizeLocale(row.language)
    const status = row.status ?? '-'

    const normalized: NormalizedStrategyRow = {
      keyword: row.keyword,
      targetUrl,
      locale,
      category: parsed.category,
      slug: parsed.slug,
      volume: row.volume ?? 0,
      difficulty: row.difficulty ?? 0,
      status,
      clusterType: row.clusterType,
      source,
    }

    strategyRows.push(normalized)
    keywordPool.push({
      keyword: row.keyword,
      locale,
      category: parsed.category,
      slug: parsed.slug,
      targetUrl,
      volume: row.volume ?? 0,
      difficulty: row.difficulty ?? 0,
      status,
      clusterType: row.clusterType,
      source,
    })
  }

  return { strategyRows, keywordPool }
}

function getExistingPostKeys(postsDir: string): Set<string> {
  const files = globSync('**/*.md', { cwd: postsDir, nodir: true })
  const result = new Set<string>()

  for (const relativePath of files) {
    const segments = relativePath.split('/')
    if (segments.length < 2) continue

    const category = segments[0]
    const filename = segments[segments.length - 1]
    if (!category || !filename) continue

    let locale: Locale = 'es'
    let slug = filename.replace(/\.md$/, '')

    if (filename.endsWith('.en.md')) {
      locale = 'en'
      slug = filename.replace(/\.en\.md$/, '')
    } else if (filename.endsWith('.es.md')) {
      locale = 'es'
      slug = filename.replace(/\.es\.md$/, '')
    }

    if (!slug) continue
    result.add(buildExistingPostKey(locale, category, slug))
  }

  return result
}

function readFileOrThrow(filePath: string): string {
  if (!existsSync(filePath)) throw new Error(`File not found: ${filePath}`)
  return readFileSync(filePath, 'utf-8')
}

function resolveLanguageAndCountry(locale: Locale): { language: string; country: string; languageLabel: string } {
  if (locale === 'en') {
    return { language: 'en', country: 'US', languageLabel: 'English' }
  }
  return { language: 'es', country: 'ES', languageLabel: 'Spanish' }
}

function resolveGeneratedPostPath(rootDir: string, assignment: KeywordAssignment): string {
  const filename = assignment.gap.locale === 'en' ? `${assignment.gap.slug}.en.md` : `${assignment.gap.slug}.md`
  return resolve(rootDir, 'content', 'posts', assignment.gap.category, filename)
}

function normalizeText(input: string): string {
  return input.replace(/[#*_`>\[\]()]/g, ' ').replace(/\s+/g, ' ').trim()
}

function deriveMetadataFromContent(keyword: string, title: string, markdown: string, locale: Locale): DraftMetadata {
  const lines = markdown.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const firstParagraph = normalizeText(lines.find((l) => !l.startsWith('#')) || '')
  const baseTitle = title?.trim() || normalizeText(lines[0] || keyword) || keyword
  const normalizedTitle = baseTitle.length > 70 ? `${baseTitle.slice(0, 67)}...` : baseTitle

  const metaTitleRaw = locale === 'en'
    ? `${normalizedTitle} | Juan Tech`
    : `${normalizedTitle} | Juan Tech`
  const metaTitle = metaTitleRaw.length <= 60 ? metaTitleRaw : `${metaTitleRaw.slice(0, 57)}...`

  const seed = firstParagraph || (locale === 'en'
    ? `Practical guide about ${keyword} with clear steps and examples.`
    : `Guia practica sobre ${keyword} con pasos claros y ejemplos.`)

  let metaDescription = seed
  if (metaDescription.length < 120) {
    metaDescription = `${metaDescription} ${locale === 'en' ? 'Includes implementation details and key takeaways.' : 'Incluye detalles de implementacion y conclusiones clave.'}`
  }
  if (metaDescription.length > 160) {
    metaDescription = `${metaDescription.slice(0, 157)}...`
  }

  return {
    title: normalizedTitle,
    metaTitle,
    metaDescription,
  }
}

function persistGeneratedDraft(rootDir: string, assignment: KeywordAssignment, metadata: DraftMetadata, body: string): void {
  const filePath = resolveGeneratedPostPath(rootDir, assignment)
  const frontmatter = {
    title: metadata.title,
    metaTitle: metadata.metaTitle,
    metaDescription: metadata.metaDescription,
    slug: assignment.gap.slug,
    publishedAt: new Date().toISOString().split('T')[0],
    idioma: assignment.gap.locale, // FIXED: Use locale directly (en or es)
    uploaded: false,
    categoryTitle: CATEGORY_LABELS[assignment.gap.category] || assignment.gap.category,
    authors: ['juan-carlos-angulo'],
  }

  writeFileSync(filePath, matter.stringify(body, frontmatter), 'utf-8')
}

function persistMetadataInFileIfExists(rootDir: string, assignment: KeywordAssignment, metadata: DraftMetadata): void {
  const filePath = resolveGeneratedPostPath(rootDir, assignment)
  if (!existsSync(filePath)) return

  const parsed = matter(readFileSync(filePath, 'utf-8'))
  const nextData = {
    ...parsed.data,
    title: metadata.title,
    metaTitle: metadata.metaTitle,
    metaDescription: metadata.metaDescription,
    idioma: assignment.gap.locale, // FIXED: Ensure idioma matches locale
  }

  writeFileSync(filePath, matter.stringify(parsed.content, nextData), 'utf-8')
}

async function defaultDraftGenerator(
  assignment: KeywordAssignment,
  rootDir: string,
): Promise<DraftMetadata> {
  const { language, country, languageLabel } = resolveLanguageAndCountry(assignment.gap.locale)

  // CRITICAL: ONLY DinoBrain API - NO LLM INVOLVED
  // This is the single source of content generation
  const brain = new DinoBrainApiAdapter()
  const generated = await brain.generate({
    keyword: assignment.keyword,
    language,
    country,
    domain: 'juan-tech.com',
    siteType: 'nicho',
    numWords: 2000,
  })

  const metadata = deriveMetadataFromContent(assignment.keyword, generated.title, generated.markdown, assignment.gap.locale)

  const postDir = resolve(rootDir, 'content', 'posts', assignment.gap.category)
  if (!existsSync(postDir)) {
    mkdirSync(postDir, { recursive: true })
  }

  persistGeneratedDraft(rootDir, assignment, metadata, generated.markdown)
  return metadata
}

export async function runEditorialPipeline(options: PipelineOptions = {}, deps: PipelineDependencies = {}): Promise<PipelineResult> {
  const rootDir = resolve(options.rootDir ?? process.cwd())
  const contentDir = resolve(rootDir, options.contentDir ?? 'content')
  const postsDir = resolve(rootDir, options.postsDir ?? join(contentDir, 'posts'))
  const strategyFile = resolve(rootDir, options.strategyFile ?? join(contentDir, 'keywords_backlog.md'))
  const keywordsFile = resolve(rootDir, options.keywordsFile ?? join(contentDir, 'keywords_backlog.md'))
  const validateContent = options.validateContent ?? true

  console.log(`[pipeline] ════════════════════════════════════════════════════`)
  console.log(`[pipeline] Editorial Pipeline - ${options.dryRun ? 'DRY RUN' : 'REAL EXECUTION'}`)
  console.log(`[pipeline] ════════════════════════════════════════════════════`)
  console.log(`[pipeline] ⚡ CONTENT SOURCE: 🧠 DINOBRAIN API ONLY`)
  console.log(`[pipeline] ⚡ NO LLM (OpenAI/Anthropic/Gemini) INVOLVED`)
  console.log(`[pipeline] Strategy file: ${strategyFile}`)
  console.log(`[pipeline] Posts dir: ${postsDir}`)

  const strategyContent = readFileOrThrow(strategyFile)
  const keywordContent = readFileOrThrow(keywordsFile)

  const strategyData = normalizeRowsFromMarkdown(strategyContent, 'keywords_backlog')
  const keywordData = normalizeRowsFromMarkdown(keywordContent, 'keywords_backlog')

  const filteredStrategyRows = options.locale
    ? strategyData.strategyRows.filter((row) => row.locale === options.locale)
    : strategyData.strategyRows

  const filteredKeywordPool = options.locale
    ? keywordData.keywordPool.filter((row) => row.locale === options.locale)
    : keywordData.keywordPool

  console.log(`[pipeline] Rows loaded: strategy=${filteredStrategyRows.length}, keyword-pool=${filteredKeywordPool.length}`)

  if (options.locale) {
    const localeLabel = options.locale === 'en' ? '🇬🇧 ENGLISH' : '🇪🇸 SPANISH'
    console.log(`[pipeline] Language Filter: ${localeLabel}`)
  }

  const existingPostKeys = getExistingPostKeys(postsDir)
  const gapCandidates = analyzeGaps({ strategyRows: filteredStrategyRows, existingPostKeys })

  const allAssignments = assignKeywords({ gaps: gapCandidates, keywordPool: filteredKeywordPool })
  const limit = typeof options.limit === 'number' && options.limit > 0 ? options.limit : allAssignments.length
  const assignments = allAssignments.slice(0, limit)

  console.log(`[pipeline] Gaps detected: ${gapCandidates.length}`)
  console.log(`[pipeline] Assignments selected: ${assignments.length}${limit !== allAssignments.length ? ` (limit=${limit})` : ''}`)

  const gapsPath = join(contentDir, 'pipeline-gaps.json')
  const assignmentsPath = join(contentDir, 'pipeline-assignments.json')
  writeFileSync(gapsPath, JSON.stringify(gapCandidates, null, 2) + '\n', 'utf-8')
  writeFileSync(assignmentsPath, JSON.stringify(assignments, null, 2) + '\n', 'utf-8')

  console.log(`[pipeline] Artifacts written:`)
  console.log(`  - ${gapsPath}`)
  console.log(`  - ${assignmentsPath}`)

  const metadataStatus: MetadataStatus[] = []

  if (!options.dryRun) {
    const generator = deps.draftGenerator ?? defaultDraftGenerator

    for (let index = 0; index < assignments.length; index += 1) {
      const assignment = assignments[index]!
      const { languageLabel } = resolveLanguageAndCountry(assignment.gap.locale)
      const localeEmoji = assignment.gap.locale === 'en' ? '🇬🇧' : '🇪🇸'
      const label = `[pipeline] [${index + 1}/${assignments.length}] ${localeEmoji} ${languageLabel.toUpperCase()} | ${assignment.gap.category}/${assignment.gap.slug}`
      
      console.log(``)
      console.log(`${label}`)
      console.log(`[pipeline]   keyword: "${assignment.keyword}"`)
      console.log(`[pipeline]   source: 🧠 DinoBrain API (NOT OpenAI/LLM)`)

      try {
        const draftMetadata = await generator(assignment, rootDir)
        const validation = validateAndRepairMetadata(draftMetadata, assignment.keyword)

        // Read generated content for quality validation
        const filePath = resolveGeneratedPostPath(rootDir, assignment)
        if (!existsSync(filePath)) {
          const fileDir = filePath.split('/').slice(0, -1).join('/')
          if (!existsSync(fileDir)) mkdirSync(fileDir, { recursive: true })
          writeFileSync(filePath, matter.stringify('', {
            title: draftMetadata.title,
            metaTitle: draftMetadata.metaTitle,
            metaDescription: draftMetadata.metaDescription,
          }), 'utf-8')
        }
        const fileContent = readFileSync(filePath, 'utf-8')
        const parsed = matter(fileContent)
        
        let qualityReport = null
        if (validateContent) {
          qualityReport = validateContentQuality(parsed.content, assignment.keyword)
          console.log(`[pipeline]   content quality:`)
          const reportLines = formatQualityReport(qualityReport).split('\n')
          for (const line of reportLines) {
            console.log(`[pipeline]     ${line}`)
          }
        }

        persistMetadataInFileIfExists(rootDir, assignment, validation.metadata)

        metadataStatus.push({
          slug: assignment.gap.slug,
          valid: validation.valid,
          repaired: validation.repaired,
          issues: validation.issues,
          metadata: validation.metadata,
        })

        const outputPath = resolveGeneratedPostPath(rootDir, assignment)
        console.log(`[pipeline]   metadata: valid=${validation.valid}, repaired=${validation.repaired}`)
        console.log(`[pipeline]   output: ${outputPath}`)
        console.log(`[pipeline] ✅ SUCCESS`)

        if (options.strictMetadata && !validation.valid) {
          throw new Error(`Strict metadata mode failed for ${assignment.gap.slug}`)
        }
      } catch (error) {
        console.error(`[pipeline] ❌ FAILED: ${error instanceof Error ? error.message : String(error)}`)
        throw error
      }
    }

    console.log(``)
    console.log(`[pipeline] ════════════════════════════════════════════════════`)
    console.log(`[pipeline] Real run completed: ${metadataStatus.length}/${assignments.length} generated`)
    console.log(`[pipeline] All content generated from 🧠 DinoBrain API (NO LLM)`)
    console.log(`[pipeline] ════════════════════════════════════════════════════`)
  } else {
    console.log(`[pipeline] Dry-run completed: no content generation executed`)
  }

  return {
    gaps: gapCandidates,
    assignments,
    metadataStatus,
    artifacts: { gapsPath, assignmentsPath },
  }
}

export const pipelineInternals = {
  normalizeRowsFromMarkdown,
  parseCategoryAndSlug,
  getExistingPostKeys,
  defaultDraftGenerator,
  resolveGeneratedPostPath,
  persistMetadataInFileIfExists,
  deriveMetadataFromContent,
}
