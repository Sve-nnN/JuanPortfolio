import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { runEditorialPipeline } from '../../../src/scripts/engine/pipeline'
import { runEngineCli } from '../../../src/scripts/engine'

const createdDirs: string[] = []

function createFixtureWorkspace(): { rootDir: string; contentDir: string } {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jt-pipeline-'))
  createdDirs.push(rootDir)

  const contentDir = path.join(rootDir, 'content')
  const postsDir = path.join(contentDir, 'posts')
  fs.mkdirSync(postsDir, { recursive: true })

  fs.mkdirSync(path.join(postsDir, 'seo'), { recursive: true })
  fs.writeFileSync(path.join(postsDir, 'seo', 'existing-post.en.md'), '# Existing Post')

  const backlog = [
    '# Keywords Backlog',
    '',
    '| Keyword | Target URL | Language | Volume | Difficulty | Status | Cluster Type |',
    '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |',
    '| seo content strategy | /seo/seo-content-strategy | en | 4100 | 8 | Pendiente | pillar |',
    '| topic clusters seo | /seo/topic-clusters-seo | en | 400 | 27 | Pendiente | satellite |',
    '| auditoria seo | /tech-seo/auditoria-seo | es | 1300 | 3 | Pendiente | satellite |',
    '| existing post keyword | /seo/existing-post | en | 100 | 5 | Pendiente | satellite |',
  ].join('\n')

  fs.writeFileSync(path.join(contentDir, 'keywords_backlog.md'), backlog, 'utf-8')
  return { rootDir, contentDir }
}

afterEach(() => {
  while (createdDirs.length > 0) {
    const dir = createdDirs.pop()
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  }
})

describe('engine pipeline integration', () => {
  it('dry-run generates deterministic artifacts without drafting', async () => {
    const { rootDir } = createFixtureWorkspace()

    const result = await runEditorialPipeline({
      rootDir,
      dryRun: true,
      locale: 'en',
      limit: 1,
    })

    expect(result.assignments).toHaveLength(1)
    expect(result.assignments[0]?.gap.slug).toBe('seo-content-strategy')
    expect(result.metadataStatus).toEqual([])

    const gapsArtifact = JSON.parse(fs.readFileSync(result.artifacts.gapsPath, 'utf-8')) as Array<{ slug: string }>
    const assignmentsArtifact = JSON.parse(fs.readFileSync(result.artifacts.assignmentsPath, 'utf-8')) as Array<{ keyword: string }>

    expect(gapsArtifact.some((entry) => entry.slug === 'existing-post')).toBe(false)
    expect(assignmentsArtifact).toHaveLength(1)
  })

  it('pipeline returns metadata status for processed assignments', async () => {
    const { rootDir } = createFixtureWorkspace()

    const result = await runEditorialPipeline(
      {
        rootDir,
        dryRun: false,
        locale: 'en',
        limit: 1,
      },
      {
        draftGenerator: async () => ({
          title: 'SEO Content Strategy',
          metaTitle: 'SEO Content Strategy Guide',
          metaDescription: 'short',
        }),
      },
    )

    expect(result.metadataStatus).toHaveLength(1)
    expect(result.metadataStatus[0]?.repaired).toBe(true)
    expect(result.metadataStatus[0]?.valid).toBe(true)
  })

  it('strict mode fails when metadata is irreparable', async () => {
    const { rootDir } = createFixtureWorkspace()

    await expect(
      runEditorialPipeline(
        {
          rootDir,
          dryRun: false,
          locale: 'en',
          strictMetadata: true,
          limit: 1,
        },
        {
          draftGenerator: async () => ({
            title: '',
            metaTitle: '',
            metaDescription: '',
          }),
        },
      ),
    ).rejects.toThrow('Strict metadata mode failed')
  })

  it('CLI pipeline command accepts dry-run, limit, locale and provider options', async () => {
    const { rootDir } = createFixtureWorkspace()

    await runEngineCli([
      'node',
      'engine.ts',
      'pipeline',
      '--dry-run',
      '--limit',
      '1',
      '--locale',
      'en',
      '--provider',
      'openai',
      '--content-dir',
      path.join(rootDir, 'content'),
    ])

    const assignmentsPath = path.join(rootDir, 'content', 'pipeline-assignments.json')
    expect(fs.existsSync(assignmentsPath)).toBe(true)
  })
})
