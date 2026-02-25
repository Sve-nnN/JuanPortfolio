import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import matter from 'gray-matter'
import { getPayload } from 'payload'
import config from '../payload.config'
import { convertLexicalToMarkdown, convertMarkdownToLexical } from './utils/markdownConverter'
import * as p from '@clack/prompts'

const CONTENT_DIR = path.resolve(process.cwd(), 'content/posts')
const SYNC_STATE_FILE = path.resolve(process.cwd(), 'content/content-sync.json')

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
}

interface FileState {
  id: string
  slug: string
  idioma: 'en' | 'es'
  lastLocalHash: string
  lastRemoteUpdatedAt: string
}

interface SyncState {
  files: Record<string, FileState>
}

// --- Helpers ---

const calculateHash = (content: string): string => {
  return crypto.createHash('sha256').update(content).digest('hex')
}

const loadState = (): SyncState => {
  if (fs.existsSync(SYNC_STATE_FILE)) {
    return JSON.parse(fs.readFileSync(SYNC_STATE_FILE, 'utf-8'))
  }
  return { files: {} }
}

const saveState = (state: SyncState) => {
  fs.writeFileSync(SYNC_STATE_FILE, JSON.stringify(state, null, 2))
}

const getAllFiles = (dir: string, allFiles: string[] = []) => {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, allFiles)
    } else if (file.endsWith('.md')) {
      allFiles.push(filePath)
    }
  }
  return allFiles
}

// --- Sync Manager ---

class ContentSyncManager {
  private payload: any
  private state: SyncState
  private rejectedCategories: Set<string> = new Set()

  constructor() {
    this.state = loadState()
  }

  async init() {
    if (!this.payload) {
      process.stdout.write(`${colors.blue}⏳ Initializing Payload...${colors.reset}`)
      this.payload = await getPayload({ config })
      process.stdout.write(`${colors.green}✅ Payload initialized.       \n${colors.reset}`)
    }
  }

  // --- Commands ---

  async status() {
    await this.init()
    console.log(`\n${colors.bright}📡 Sync Status:${colors.reset}\n`)

    const files = getAllFiles(CONTENT_DIR)
    const relativeFiles = files.map((f) => path.relative(CONTENT_DIR, f))

    // Check for untracked files
    const untracked = relativeFiles.filter((f) => !this.state.files[f])
    if (untracked.length > 0) {
      console.log(`${colors.yellow}?? Untracked files (${untracked.length}):${colors.reset}`)
      untracked.forEach((f) => console.log(`   ${f}`))
      console.log('')
    }

    // Check tracked files
    for (const relPath of Object.keys(this.state.files)) {
      if (!relativeFiles.includes(relPath)) {
        console.log(`${colors.red}D  Deleted: ${relPath}${colors.reset}`)
        continue
      }

      const fileState = this.state.files[relPath]
      const fullPath = path.join(CONTENT_DIR, relPath)
      const content = fs.readFileSync(fullPath, 'utf-8')
      const currentHash = calculateHash(content)

      const localChanged = currentHash !== fileState.lastLocalHash

      try {
        const remoteDoc = await this.payload.findByID({
          collection: 'posts',
          id: fileState.id,
          locale: fileState.idioma,
        })

        const remoteUpdatedAt = new Date(remoteDoc.updatedAt).getTime()
        const lastSyncedRemote = new Date(fileState.lastRemoteUpdatedAt).getTime()

        const remoteChanged = remoteUpdatedAt > lastSyncedRemote

        if (localChanged && remoteChanged) {
          console.log(`${colors.red}C  Conflict: ${relPath} (Both modified)${colors.reset}`)
        } else if (localChanged) {
          console.log(`${colors.green}M  Modified (Local): ${relPath}${colors.reset}`)
        } else if (remoteChanged) {
          console.log(`${colors.blue}U  Update (Remote): ${relPath}${colors.reset}`)
        }
      } catch (e) {
        console.log(
          `${colors.red}! Orphaned local state for ${relPath} (ID: ${fileState.id} not found)${colors.reset}`,
        )
      }
    }
  }

  async fetch() {
    await this.init()
    console.log(`${colors.blue}⬇️  Fetching remote state...${colors.reset}`)

    for (const [relPath, fileState] of Object.entries(this.state.files)) {
      try {
        const remoteDoc = await this.payload.findByID({
          collection: 'posts',
          id: fileState.id,
          locale: fileState.idioma,
        })

        const remoteDate = new Date(remoteDoc.updatedAt).getTime()
        const lastSyncDate = new Date(fileState.lastRemoteUpdatedAt).getTime()

        if (remoteDate > lastSyncDate) {
          console.log(`   ${colors.blue}* New changes for ${relPath}${colors.reset}`)
        }
      } catch (error) {
        console.log(
          `   ${colors.red}! Remote post not found for ${relPath} (ID: ${fileState.id}) — ${error}${colors.reset}`,
        )
      }
    }
    console.log(`${colors.green}✅ Fetch complete.${colors.reset}`)
  }

  async pull() {
    await this.init()
    console.log(`${colors.blue}⬇️  Pulling changes...${colors.reset}`)

    for (const [relPath, fileState] of Object.entries(this.state.files)) {
      const fullPath = path.join(CONTENT_DIR, relPath)

      if (!fs.existsSync(fullPath)) continue

      const content = fs.readFileSync(fullPath, 'utf-8')
      const currentHash = calculateHash(content)
      const localChanged = currentHash !== fileState.lastLocalHash

      try {
        const remoteDoc = await this.payload.findByID({
          collection: 'posts',
          id: fileState.id,
          locale: fileState.idioma,
        })

        const remoteUpdatedAt = remoteDoc.updatedAt
        const remoteDate = new Date(remoteUpdatedAt).getTime()
        const lastSyncDate = new Date(fileState.lastRemoteUpdatedAt).getTime()

        if (remoteDate > lastSyncDate) {
          if (localChanged) {
            console.log(
              `${colors.red}❌ Conflict in ${relPath}. Local changes would be overwritten.${colors.reset}`,
            )
            continue
          }

          const mdContent = convertLexicalToMarkdown(remoteDoc.content.content)

          const frontmatter = {
            title: remoteDoc.title,
            slug: remoteDoc.slug,
            idioma: fileState.idioma,
            publishedAt: remoteDoc.publishedAt,
            updatedAt: remoteDoc.updatedAt,
            authors: remoteDoc.authors?.map((a: any) => a.id || a),
          }

          const newFileContent = matter.stringify(mdContent, frontmatter)
          fs.writeFileSync(fullPath, newFileContent, 'utf-8')

          this.state.files[relPath] = {
            ...fileState,
            lastLocalHash: calculateHash(newFileContent),
            lastRemoteUpdatedAt: remoteUpdatedAt,
          }
          saveState(this.state)
          console.log(`${colors.green}✅ Updated ${relPath}${colors.reset}`)
        }
      } catch (e) {
        console.log(
          `${colors.red}❌ Error pulling ${relPath}: Post ID ${fileState.id} not found.${colors.reset}`,
        )
      }
    }
  }

  async push(force = false, postFilename?: string) {
    await this.init()
    console.log(`${colors.blue}⬆️  Pushing changes...${colors.reset}`)

    let filesToProcess = getAllFiles(CONTENT_DIR)

    if (postFilename) {
      const fullPath = path.join(CONTENT_DIR, postFilename)
      if (!fs.existsSync(fullPath)) {
        console.log(`${colors.red}❌ Error: Post file '${postFilename}' not found.${colors.reset}`)
        return
      }
      filesToProcess = [fullPath]
      console.log(`${colors.yellow}🔍 Syncing specific post: ${postFilename}${colors.reset}`)
    }

    for (const fullPath of filesToProcess) {
      const relPath = path.relative(CONTENT_DIR, fullPath)
      const content = fs.readFileSync(fullPath, 'utf-8')
      const { data, content: mdBody } = matter(content)
      const frontmatter = data as any
      const currentHash = calculateHash(content)

      const fileState = this.state.files[relPath]
      let isNew = !fileState

      if (!frontmatter.title) {
        console.log(`${colors.yellow}⚠️  Skipping ${relPath}: Missing title.${colors.reset}`)
        continue
      }

      if (!frontmatter.idioma || (frontmatter.idioma !== 'en' && frontmatter.idioma !== 'es')) {
        console.log(
          `${colors.red}❌ Skipping ${relPath}: Invalid or missing 'idioma' in frontmatter. Must be 'en' or 'es'.${colors.reset}`,
        )
        continue
      }

      const slug = frontmatter.slug || path.basename(fullPath).replace('.md', '')

      if (!isNew && !force) {
        if (currentHash === fileState.lastLocalHash) {
          continue
        }

        try {
          const remoteDoc = await this.payload.findByID({
            collection: 'posts',
            id: fileState.id,
            locale: fileState.idioma,
          })

          const remoteDate = new Date(remoteDoc.updatedAt).getTime()
          const lastSyncDate = new Date(fileState.lastRemoteUpdatedAt).getTime()

          if (remoteDate > lastSyncDate) {
            console.log(
              `${colors.red}❌ Conflict in ${relPath}: Remote has changed since last sync.${colors.reset}`,
            )
            continue
          }
        } catch (e) {
          console.log(
            `${colors.yellow}⚠️  Post ID ${fileState.id} not found. Treating as new.${colors.reset}`,
          )
          isNew = true
        }
      }

      // Resolve categories from path first to see if we should skip
      const categoryIds = new Set<string>()
      const categorySlugFromPath = path.dirname(relPath)

      if (categorySlugFromPath && categorySlugFromPath !== '.') {
        if (this.rejectedCategories.has(categorySlugFromPath)) {
          console.log(
            `${colors.yellow}⏭️  Skipping ${relPath}: Category '${categorySlugFromPath}' was rejected.${colors.reset}`,
          )
          continue
        }
        const id = await this.resolveCategory(categorySlugFromPath, frontmatter.idioma)
        if (id) {
          categoryIds.add(id)
        } else {
          // User chose not to create it, add to rejected and skip
          this.rejectedCategories.add(categorySlugFromPath)
          console.log(
            `${colors.yellow}⏭️  Skipping ${relPath}: Category '${categorySlugFromPath}' rejected.${colors.reset}`,
          )
          continue
        }
      }

      const lexicalContent = convertMarkdownToLexical(
        mdBody,
        frontmatter.primary_keywords?.[0],
        frontmatter.idioma,
      )

      let primaryKeywordId
      if (frontmatter.primary_keywords?.[0]) {
        primaryKeywordId = await this.resolveKeyword(frontmatter.primary_keywords[0])
      }

      const semanticKeywordIds = []
      if (frontmatter.semantic_keywords) {
        for (const kw of frontmatter.semantic_keywords) {
          const id = await this.resolveKeyword(kw)
          if (id) semanticKeywordIds.push(id)
        }
      }

      // Resolve authors
      const authorIds = []
      if (frontmatter.authors && Array.isArray(frontmatter.authors)) {
        for (const authorSlug of frontmatter.authors) {
          const id = await this.resolveAuthor(authorSlug)
          if (id) authorIds.push(id)
        }
      }

      // Resolve categories from frontmatter
      if (frontmatter.categoryTitle) {
        const categorySlug = frontmatter.categoryTitle.toLowerCase().replace(/\s+/g, '-')
        const id = await this.resolveCategory(categorySlug, frontmatter.idioma)
        if (id) categoryIds.add(id)
      }
      if (frontmatter.categories && Array.isArray(frontmatter.categories)) {
        for (const catSlug of frontmatter.categories) {
          const id = await this.resolveCategory(catSlug, frontmatter.idioma)
          if (id) categoryIds.add(id)
        }
      }

      const postData: any = {
        title: frontmatter.title,
        slug: slug,
        content: {
          content: lexicalContent,
        },
        primaryKeyword: primaryKeywordId,
        semanticKeywords: semanticKeywordIds,
        publishedAt: frontmatter.publishedAt || new Date().toISOString(),
        _status: frontmatter.status || (frontmatter.uploaded === false ? 'draft' : 'published'),
        meta: {
          title: frontmatter.metaTitle,
          description: frontmatter.metaDescription,
        },
        authors: authorIds,
        categories: Array.from(categoryIds),
      }

      let docID = isNew ? null : fileState?.id
      let resultDoc

      try {
        if (docID) {
          try {
            resultDoc = await this.payload.update({
              collection: 'posts',
              id: docID,
              data: postData,
              locale: frontmatter.idioma,
              context: { disableRevalidate: true },
            })
          } catch (e: any) {
            if (e.status === 404 || e.message?.includes('not found')) {
              console.log(
                `${colors.yellow}⚠️  Post ID ${docID} not found during update. Attempting creation.${colors.reset}`,
              )
              docID = null
            } else {
              throw e
            }
          }
        }

        if (!docID) {
          const existing = await this.payload.find({
            collection: 'posts',
            where: { slug: { equals: slug } },
            limit: 1,
          })

          if (existing.docs.length > 0) {
            docID = existing.docs[0].id
            resultDoc = await this.payload.update({
              collection: 'posts',
              id: docID,
              data: postData,
              locale: frontmatter.idioma,
              context: { disableRevalidate: true },
            })
          } else {
            resultDoc = await this.payload.create({
              collection: 'posts',
              data: postData,
              locale: frontmatter.idioma,
              context: { disableRevalidate: true },
            })
            docID = resultDoc.id
          }
        }

        this.state.files[relPath] = {
          id: docID!,
          slug,
          idioma: frontmatter.idioma,
          lastLocalHash: currentHash,
          lastRemoteUpdatedAt: resultDoc.updatedAt,
        }
        saveState(this.state)
        console.log(`${colors.green}✅ Pushed ${relPath}${colors.reset}`)
      } catch (error) {
        console.log(`${colors.red}❌ Error pushing ${relPath}: ${error}${colors.reset}`)
      }
    }
  }

  private async resolveKeyword(keyword: string): Promise<string | null> {
    try {
      const found = await this.payload.find({
        collection: 'keyword-metrics',
        where: { keyword: { equals: keyword } },
        limit: 1,
      })
      if (found.docs.length > 0) {
        return found.docs[0].id
      }
      return null
    } catch (error) {
      console.error(`Error resolving keyword ${keyword}:`, error)
      return null
    }
  }

  private async resolveAuthor(authorSlug: string): Promise<string | null> {
    try {
      const found = await this.payload.find({
        collection: 'users',
        where: { slug: { equals: authorSlug } },
        limit: 1,
      })
      if (found.docs.length > 0) {
        return found.docs[0].id
      }
      return null
    } catch (error) {
      console.error(`Error resolving author ${authorSlug}:`, error)
      return null
    }
  }

  private async resolveCategory(categorySlug: string, locale: string): Promise<string | null> {
    try {
      const found = await this.payload.find({
        collection: 'categories',
        where: { slug: { equals: categorySlug } },
        limit: 1,
      })
      if (found.docs.length > 0) {
        return found.docs[0].id
      }

      // If we already rejected this slug in this session, don't ask again
      if (this.rejectedCategories.has(categorySlug)) return null

      // Category not found, prompt to create
      console.log(
        `\n${colors.yellow}❓ Category with slug '${categorySlug}' not found.${colors.reset}`,
      )
      const shouldCreate = await p.confirm({
        message: `Do you want to create category '${categorySlug}' now?`,
      })

      if (shouldCreate === true) {
        const titleInput = await p.text({
          message: 'Enter the new category name (title):',
          validate: (value) => {
            if (typeof value !== 'string' || value.length === 0) return 'Name cannot be empty'
          },
        })

        if (p.isCancel(titleInput)) {
          console.log(`${colors.red}Cancelled category creation.${colors.reset}`)
          return null
        }

        const descriptionInput = await p.text({
          message: 'Enter the new category description:',
        })

        if (p.isCancel(descriptionInput)) {
          console.log(`${colors.red}Cancelled category creation.${colors.reset}`)
          return null
        }

        const newCategory = await this.payload.create({
          collection: 'categories',
          data: {
            title: titleInput,
            slug: categorySlug,
            description: descriptionInput,
          },
          locale: locale,
        })
        console.log(
          `${colors.green}✅ Category '${titleInput}' created successfully.${colors.reset}\n`,
        )
        return newCategory.id
      }

      return null
    } catch (error) {
      console.error(`Error resolving or creating category ${categorySlug}:`, error)
      return null
    }
  }
}

// --- CLI ---

const run = async () => {
  const args = process.argv.slice(2)
  const command = args[0]
  const force = args.includes('--force')
  const postArg = args.find((arg) => arg.startsWith('--post='))
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
