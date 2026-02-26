import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../payload.config'
import { convertLexicalToMarkdown } from './utils/markdownConverter'
import matter from 'gray-matter'

import { loadState, saveState, calculateHash, getAllMdFiles } from './sync/stateManager'
import { parsePostFile, validatePost, buildPostData } from './sync/postParser'
import { PayloadRepository } from './sync/payloadRepository'
import type { SyncState, FileState, Locale, ResolvedIds } from './sync/types'

const CONTENT_DIR = path.resolve(process.cwd(), 'content/posts')
const SYNC_STATE_FILE = path.resolve(process.cwd(), 'content/content-sync.json')

// ANSI Colors
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
}

// --- ContentSyncManager ---

class ContentSyncManager {
  private repo!: PayloadRepository
  private state: SyncState
  private rejectedCategories: Set<string> = new Set()

  constructor() {
    this.state = loadState(SYNC_STATE_FILE)
  }

  async init() {
    if (!this.repo) {
      process.stdout.write(`${c.blue}⏳ Initializing Payload...${c.reset}`)
      const payload = await getPayload({ config })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.repo = new PayloadRepository(payload as any)
      process.stdout.write(`${c.green}✅ Payload initialized.       \n${c.reset}`)
    }
  }

  // --- Commands ---

  async status() {
    await this.init()
    console.log(`\n${c.bright}📡 Sync Status:${c.reset}\n`)

    const files = getAllMdFiles(CONTENT_DIR)
    const relativeFiles = files.map(f => path.relative(CONTENT_DIR, f))

    const untracked = relativeFiles.filter(f => !this.state.files[f])
    if (untracked.length > 0) {
      console.log(`${c.yellow}?? Untracked files (${untracked.length}):${c.reset}`)
      untracked.forEach(f => console.log(`   ${f}`))
      console.log('')
    }

    for (const relPath of Object.keys(this.state.files)) {
      if (!relativeFiles.includes(relPath)) {
        console.log(`${c.red}D  Deleted: ${relPath}${c.reset}`)
        continue
      }

      const fileState = this.state.files[relPath]
      const fullPath = path.join(CONTENT_DIR, relPath)
      const content = fs.readFileSync(fullPath, 'utf-8')
      const localChanged = calculateHash(content) !== fileState.lastLocalHash

      try {
        const remoteDoc = await this.repo.getPost(fileState.id, fileState.locale)
        const remoteChanged =
          new Date(remoteDoc.updatedAt as string).getTime() >
          new Date(fileState.lastRemoteUpdatedAt).getTime()

        if (localChanged && remoteChanged) {
          console.log(`${c.red}C  Conflict: ${relPath} (Both modified)${c.reset}`)
        } else if (localChanged) {
          console.log(`${c.green}M  Modified (Local): ${relPath}${c.reset}`)
        } else if (remoteChanged) {
          console.log(`${c.blue}U  Update (Remote): ${relPath}${c.reset}`)
        }
      } catch (e) {
        console.log(`${c.red}! Orphaned local state for ${relPath} (ID: ${fileState.id} not found)${c.reset}`)
      }
    }
  }

  async fetch() {
    await this.init()
    console.log(`${c.blue}⬇️  Fetching remote state...${c.reset}`)

    for (const [relPath, fileState] of Object.entries(this.state.files)) {
      try {
        const remoteDoc = await this.repo.getPost(fileState.id, fileState.locale)
        const remoteDate = new Date(remoteDoc.updatedAt as string).getTime()
        const lastSyncDate = new Date(fileState.lastRemoteUpdatedAt).getTime()
        if (remoteDate > lastSyncDate) {
          console.log(`   ${c.blue}* New changes for ${relPath}${c.reset}`)
        }
      } catch {
        console.log(`   ${c.red}! Remote post not found for ${relPath} (ID: ${fileState.id})${c.reset}`)
      }
    }
    console.log(`${c.green}✅ Fetch complete.${c.reset}`)
  }

  async pull() {
    await this.init()
    console.log(`${c.blue}⬇️  Pulling changes...${c.reset}`)

    for (const [relPath, fileState] of Object.entries(this.state.files)) {
      const fullPath = path.join(CONTENT_DIR, relPath)
      if (!fs.existsSync(fullPath)) continue

      const rawContent = fs.readFileSync(fullPath, 'utf-8')
      const localChanged = calculateHash(rawContent) !== fileState.lastLocalHash

      try {
        const remoteDoc = await this.repo.getPost(fileState.id, fileState.locale)
        const remoteUpdatedAt = remoteDoc.updatedAt as string
        const remoteDate = new Date(remoteUpdatedAt).getTime()
        const lastSyncDate = new Date(fileState.lastRemoteUpdatedAt).getTime()

        if (remoteDate <= lastSyncDate) continue

        if (localChanged) {
          console.log(`${c.red}❌ Conflict in ${relPath}. Local changes would be overwritten.${c.reset}`)
          continue
        }

        const mdContent = convertLexicalToMarkdown(
          (remoteDoc.content as { content: Parameters<typeof convertLexicalToMarkdown>[0] }).content,
        )
        const frontmatter = {
          title: remoteDoc.title,
          slug: remoteDoc.slug,
          idioma: fileState.locale,
          tldr: remoteDoc.tldr,
          publishedAt: remoteDoc.publishedAt,
          updatedAt: remoteDoc.updatedAt,
          authors: (remoteDoc.authors as Array<{ id?: string } | string>)?.map(
            a => (typeof a === 'string' ? a : a.id ?? a),
          ),
        }

        const newFileContent = matter.stringify(mdContent, frontmatter)
        fs.writeFileSync(fullPath, newFileContent, 'utf-8')

        this.state.files[relPath] = {
          ...fileState,
          lastLocalHash: calculateHash(newFileContent),
          lastRemoteUpdatedAt: remoteUpdatedAt,
        }
        saveState(SYNC_STATE_FILE, this.state)
        console.log(`${c.green}✅ Updated ${relPath}${c.reset}`)
      } catch (e) {
        console.log(`${c.red}❌ Error pulling ${relPath}: Post ID ${fileState.id} not found.${c.reset}`)
      }
    }
  }

  async push(force = false, postFilename?: string) {
    await this.init()
    console.log(`${c.blue}⬆️  Pushing changes...${c.reset}`)

    let filesToProcess = getAllMdFiles(CONTENT_DIR)

    if (postFilename) {
      const fullPath = path.join(CONTENT_DIR, postFilename)
      if (!fs.existsSync(fullPath)) {
        console.log(`${c.red}❌ Error: Post file '${postFilename}' not found.${c.reset}`)
        return
      }
      filesToProcess = [fullPath]
      console.log(`${c.yellow}🔍 Syncing specific post: ${postFilename}${c.reset}`)
    }

    for (const fullPath of filesToProcess) {
      const relPath = path.relative(CONTENT_DIR, fullPath)
      const rawContent = fs.readFileSync(fullPath, 'utf-8')
      const parsed = parsePostFile(fullPath, rawContent)
      const currentHash = calculateHash(rawContent)

      const validationErrors = validatePost(parsed)
      if (validationErrors.length > 0) {
        console.log(
          `${c.yellow}⚠️  Skipping ${relPath}: ${validationErrors.join(', ')}${c.reset}`,
        )
        continue
      }

      const fileState = this.state.files[relPath]
      let isNew = !fileState

      if (!isNew && !force) {
        if (currentHash === fileState.lastLocalHash) continue

        try {
          const remoteDoc = await this.repo.getPost(fileState.id, fileState.locale)
          const remoteDate = new Date(remoteDoc.updatedAt as string).getTime()
          const lastSyncDate = new Date(fileState.lastRemoteUpdatedAt).getTime()

          if (remoteDate > lastSyncDate) {
            console.log(
              `${c.red}❌ Conflict in ${relPath}: Remote has changed since last sync.${c.reset}`,
            )
            continue
          }
        } catch (e) {
          console.log(`${c.yellow}⚠️  Post ID ${fileState.id} not found. Treating as new.${c.reset}`)
          isNew = true
        }
      }

      try {
        const resolved = await this.resolveRelationships(parsed)
        const postData = buildPostData(parsed, resolved)

        let docID = isNew ? undefined : fileState?.id
        let resultDoc: Record<string, unknown>

        if (docID) {
          resultDoc = await this.repo.updatePost(docID, postData, parsed.locale)
        } else {
          const existing = await this.repo.findPostBySlug(parsed.slug)
          if (existing) {
            docID = existing.id
            resultDoc = await this.repo.updatePost(docID, postData, parsed.locale)
          } else {
            resultDoc = await this.repo.createPost(postData, parsed.locale)
            docID = resultDoc.id as string
          }
        }

        const newState: FileState = {
          id: docID as string,
          slug: parsed.slug,
          locale: parsed.locale,
          lastLocalHash: currentHash,
          lastRemoteUpdatedAt: resultDoc.updatedAt as string,
        }
        this.state.files[relPath] = newState
        saveState(SYNC_STATE_FILE, this.state)
        console.log(`${c.green}✅ Pushed ${relPath}${c.reset}`)
      } catch (error) {
        console.log(`${c.red}❌ Error pushing ${relPath}: ${error}${c.reset}`)
      }
    }
  }

  // --- Private helpers ---

  private async resolveRelationships(
    post: ReturnType<typeof parsePostFile>,
  ): Promise<ResolvedIds> {
    const { frontmatter } = post

    const primaryKeywordId = frontmatter.primary_keywords?.[0]
      ? await this.repo.resolveKeyword(frontmatter.primary_keywords[0])
      : undefined

    const semanticKeywordIds: string[] = []
    for (const kw of frontmatter.semantic_keywords ?? []) {
      const id = await this.repo.resolveKeyword(kw)
      if (id) semanticKeywordIds.push(id)
    }

    const authorIds: string[] = []
    for (const slug of frontmatter.authors ?? []) {
      const id = await this.repo.resolveAuthor(slug)
      if (id) authorIds.push(id)
    }

    const categoryIds: string[] = []
    if (frontmatter.categoryTitle) {
      const slug = frontmatter.categoryTitle.toLowerCase().replace(/\s+/g, '-')
      const id = await this.repo.resolveCategory(slug)
      if (id) categoryIds.push(id)
    }
    for (const catSlug of frontmatter.categories ?? []) {
      const id = await this.repo.resolveCategory(catSlug)
      if (id) categoryIds.push(id)
    }

    return { primaryKeywordId: primaryKeywordId ?? undefined, semanticKeywordIds, authorIds, categoryIds }
  }
}

// --- CLI ---

const run = async () => {
  const args = process.argv.slice(2)
  const command = args[0]
  const force = args.includes('--force')
  const postArg = args.find(arg => arg.startsWith('--post='))
  const postFilename = postArg ? postArg.split('=')[1] : undefined

  const manager = new ContentSyncManager()

  switch (command) {
    case 'status':
      await manager.status()
      break
    case 'fetch':
      await manager.fetch()
      break
    case 'pull':
      await manager.pull()
      break
    case 'push':
      await manager.push(force, postFilename)
      break
    default:
      console.log(
        'Usage: tsx src/scripts/syncContent.ts [status|fetch|pull|push] [--force] [--post=<filename.md>]',
      )
      break
  }
  process.exit(0)
}

run()
