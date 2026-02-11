import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { getPayload } from 'payload'
import config from '../payload.config'
import { marked } from 'marked'
import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'
import readline from 'readline'
import enquirer from 'enquirer'
import { KeywordsManager } from './utils/KeywordsManager'

const { MultiSelect } = enquirer as any;

const POSTS_DIR = path.resolve(process.cwd(), 'content/posts')

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

// --- Types ---

interface PostFrontmatter {
  title: string
  publishedAt?: string
  updatedAt?: string
  categoryTitle?: string
  authors?: string[]
  relatedPosts?: string[]
  heroImage?: string
  metaTitle?: string
  metaDescription?: string
  primary_keywords?: string[]
  semantic_keywords?: string[]
  uploaded?: boolean
}

interface ImportStats {
  imported: number
  updated: number
  failed: number
  skipped: number
}

// --- Helpers ---

const validateFrontmatter = (data: Partial<PostFrontmatter>, fileName: string): string | null => {
  if (!data.title) {
    return `Missing 'title' in ${fileName}`
  }
  return null
}

const convertMarkdownToLexical = (markdown: string): SerializedEditorState => {
  const tokens = marked.lexer(markdown)
  const rootChildren: SerializedLexicalNode[] = []

  const parseInline = (appendedTokens: any[]): SerializedLexicalNode[] => {
    const nodes: SerializedLexicalNode[] = []
    appendedTokens.forEach((token) => {
      if (token.type === 'text') {
        if (token.tokens) {
          nodes.push(...parseInline(token.tokens))
        } else {
          nodes.push({
            type: 'text',
            text: token.text,
            format: 0,
            detail: 0,
            mode: 0,
            style: '',
            version: 1,
          } as any)
        }
      } else if (token.type === 'strong') {
        const children = parseInline(token.tokens)
        children.forEach((child) => {
          if (child.type === 'text') {
            ;(child as any).format = ((child as any).format || 0) | 1
          }
        })
        nodes.push(...children)
      } else if (token.type === 'em') {
        const children = parseInline(token.tokens)
        children.forEach((child) => {
          if (child.type === 'text') {
            ;(child as any).format = ((child as any).format || 0) | 2
          }
        })
        nodes.push(...children)
      } else if (token.type === 'codespan') {
        nodes.push({
          type: 'text',
          text: token.text,
          format: 16,
          detail: 0,
          mode: 0,
          style: '',
          version: 1,
        } as any)
      } else if (token.type === 'link') {
        nodes.push({
          type: 'link',
          format: '',
          indent: 0,
          version: 1,
          fields: {
            linkType: 'custom',
            newTab: false,
            url: token.href,
          },
          children: parseInline(token.tokens),
          direction: 'ltr',
        } as any)
      }
    })
    return nodes
  }

  tokens.forEach((token) => {
    if (token.type === 'heading') {
      rootChildren.push({
        type: 'heading',
        tag: `h${token.depth}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
        format: '',
        indent: 0,
        version: 1,
        children: parseInline((token as any).tokens || []),
        direction: 'ltr',
      } as any)
    } else if (token.type === 'paragraph') {
      rootChildren.push({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children: parseInline((token as any).tokens || []),
        direction: 'ltr',
      } as any)
    } else if (token.type === 'list') {
      const listNode = {
        type: 'list',
        listType: token.ordered ? 'number' : 'bullet',
        start: token.ordered && token.start ? token.start : 1,
        tag: token.ordered ? 'ol' : 'ul',
        format: '',
        indent: 0,
        version: 1,
        children: token.items.map((item: any) => ({
          type: 'listitem',
          format: '',
          indent: 0,
          version: 1,
          value: 1,
          children: parseInline(item.tokens || []),
          direction: 'ltr',
        })),
        direction: 'ltr',
      }
      rootChildren.push(listNode as any)
    } else if (token.type === 'blockquote') {
      rootChildren.push({
        type: 'quote',
        format: '',
        indent: 0,
        version: 1,
        children: parseInline((token as any).tokens || []),
        direction: 'ltr',
      } as any)
    } else if (token.type === 'code') {
      const langMap: Record<string, string> = {
        ts: 'typescript',
        tsx: 'typescript',
        js: 'javascript',
        jsx: 'javascript',
        css: 'css',
      }
      const mappedLang = langMap[token.lang || ''] || 'typescript'
      rootChildren.push({
        type: 'block',
        format: '',
        indent: 0,
        version: 2,
        fields: {
          id: new Date().getTime().toString() + Math.random().toString(36).substring(7),
          blockType: 'code-block',
          code: token.text,
          language: mappedLang,
        },
      } as any)
    }
  })

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: rootChildren,
      direction: 'ltr',
    },
  }
}

const askQuestion = (query: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close()
      resolve(ans)
    }),
  )
}

// --- Importer Class ---

class PostImporter {
  private categoryCache = new Map<string, string>()
  private stats: ImportStats = { imported: 0, updated: 0, failed: 0, skipped: 0 }
  private payload: any
  private baseDir: string
  private keywordsManager: KeywordsManager

  constructor(baseDir: string) {
    this.baseDir = baseDir
    this.keywordsManager = new KeywordsManager()
  }

  public getStats(): ImportStats {
    return { ...this.stats }
  }

  public async init() {
    process.stdout.write(`${colors.blue}⏳ Initializing Payload...${colors.reset}`)
    try {
      this.payload = await getPayload({ config })
      process.stdout.write(`\r${colors.green}✅ Payload initialized successfully.    \n${colors.reset}`)
    } catch (e) {
      process.stdout.write(`\r${colors.red}❌ Failed to init Payload: ${e}    \n${colors.reset}`)
      throw e
    }
  }

  private getAllFiles(dir: string, allFiles: { path: string; name: string }[] = []) {
    const args = process.argv.slice(2)
    const includeTest = args.includes('--include-test')
    
    const files = fs.readdirSync(dir)
    for (const file of files) {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory()) {
        // Skip 'test' directory unless explicitly requested
        if (file === 'test' && !includeTest) {
          continue
        }
        this.getAllFiles(filePath, allFiles)
      } else if (file.endsWith('.md')) {
        allFiles.push({
          path: filePath,
          name: path.relative(POSTS_DIR, filePath)
        })
      }
    }
    return allFiles
  }

  public async run() {
    if (!this.payload) {
      await this.init()
    }

    console.log(`${colors.cyan}${colors.bright}🚀 Post Import Manager${colors.reset}\n`)

    if (!fs.existsSync(this.baseDir)) {
      console.warn(`${colors.yellow}⚠️ Posts directory not found: ${this.baseDir}${colors.reset}`)
      return
    }

    const args = process.argv.slice(2)
    const fileArgIndex = args.findIndex((arg) => arg.startsWith('--file='))
    const targetFile = fileArgIndex !== -1 ? args[fileArgIndex].split('=')[1] : null
    const standaloneFile = args.find((arg) => arg.endsWith('.md') && !arg.startsWith('--'))
    const explicitFile = targetFile || standaloneFile

    let filesToProcess: { path: string; name: string }[] = []

    if (explicitFile) {
      const allAvailable = this.getAllFiles(this.baseDir)
      const found = allAvailable.find(f => f.name === explicitFile || f.name === `${explicitFile}.md` || f.path === explicitFile)
      if (found) {
        filesToProcess = [found]
      } else {
        console.error(`${colors.red}❌ Specified file not found: ${explicitFile}${colors.reset}`)
        return
      }
    } else if (process.env.NODE_ENV !== 'test' && process.stdout.isTTY) {
      const allAvailable = this.getAllFiles(this.baseDir)
      if (allAvailable.length === 0) {
        console.log(`${colors.yellow}No posts found in ${this.baseDir}${colors.reset}`)
        return
      }

      try {
        const prompt = new MultiSelect({
          name: 'selectedFiles',
          message: 'Select posts to import/update (Space to toggle, Enter to confirm):',
          choices: allAvailable.map(f => ({ name: f.name, value: f.path })),
          result(names: string[]) {
            return this.map(names);
          }
        });

        const selectionMap = await prompt.run()
        filesToProcess = Object.entries(selectionMap).map(([name, filePath]) => ({ name, path: filePath as string }))
      } catch (e) {
        // Handle Ctrl+C or other exit
        console.log(`\n${colors.yellow}Selection cancelled.${colors.reset}`)
        return
      }
    } else {
      filesToProcess = this.getAllFiles(this.baseDir)
    }

    if (filesToProcess.length === 0) {
      console.log(`${colors.yellow}No files selected. Exiting.${colors.reset}`)
      return
    }

    console.log(`\n${colors.blue}📦 Processing ${filesToProcess.length} posts...${colors.reset}\n`)

    for (const file of filesToProcess) {
      await this.processFile(file.path, path.dirname(file.path))
    }

    this.displaySummary()
  }

  private displaySummary() {
    console.log(`\n${colors.bright}Import Summary:${colors.reset}`)
    console.log(`  ${colors.green}Imported: ${this.stats.imported}${colors.reset}`)
    console.log(`  ${colors.cyan}Updated:  ${this.stats.updated}${colors.reset}`)
    console.log(`  ${colors.red}Failed:   ${this.stats.failed}${colors.reset}`)
    console.log(`  ${colors.yellow}Skipped:  ${this.stats.skipped}${colors.reset}\n`)
  }

  private async processFile(filePath: string, dir: string) {
    const fileName = path.basename(filePath)
    process.stdout.write(`${colors.dim}  Processing: ${fileName}...${colors.reset}`)
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const { data, content } = matter(fileContent)
      const frontmatter = data as PostFrontmatter

      const validationError = validateFrontmatter(frontmatter, fileName)
      if (validationError) {
        process.stdout.write(`\r${colors.red}  ❌ Error: ${validationError}    \n${colors.reset}`)
        this.stats.failed++
        return
      }

      const slug = fileName.replace('.md', '')
      const isRoot = dir === POSTS_DIR
      const categorySlug = isRoot ? null : path.basename(dir)

      let categoryId: string | null = null
      if (categorySlug) {
        categoryId = await this.getCategoryId(
          categorySlug,
          frontmatter.categoryTitle || categorySlug,
        )
      }

      const relatedPostIds = frontmatter.relatedPosts
        ? await this.resolveRelatedPosts(frontmatter.relatedPosts)
        : []

      let heroImageId: string | null = null
      if (frontmatter.heroImage) {
        heroImageId = await this.uploadMedia(frontmatter.heroImage)
      }

      const authorIds = await this.resolveAuthors(frontmatter.authors)
      const lexicalContent = convertMarkdownToLexical(content)

      const cleanContent = content
        .replace(/[#*\[\]()_>]/g, '')
        .replace(/- /g, '')
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      const metaTitle = frontmatter.metaTitle || frontmatter.title
      const metaDescription =
        frontmatter.metaDescription ||
        cleanContent.slice(0, 140) + (cleanContent.length > 140 ? '...' : '')

      const postData: any = {
        title: frontmatter.title,
        slug: slug,
        content: {
          content: lexicalContent,
          heroImage: heroImageId,
        },
        publishedAt: frontmatter.publishedAt
          ? new Date(frontmatter.publishedAt).toISOString()
          : new Date().toISOString(),
        relatedPosts: relatedPostIds,
        authors: authorIds,
        meta: {
          title: metaTitle,
          description: metaDescription,
          image: heroImageId,
        },
      }

      if (categoryId) {
        postData.categories = [categoryId]
      }

      const action = await this.upsertPost(slug, postData)
      
      // Update local file if not already marked as uploaded
      if (!frontmatter.uploaded) {
        const updatedFrontmatter = { ...frontmatter, uploaded: true }
        const updatedFileContent = matter.stringify(content, updatedFrontmatter)
        fs.writeFileSync(filePath, updatedFileContent, 'utf-8')
      }

      // Synchronize with keywords.md
      const targetUrl = categorySlug ? `/${categorySlug}/${slug}` : `/${slug}`
      this.keywordsManager.updateStatusByUrl(targetUrl, 'Published')

      process.stdout.write(`\r  ${colors.green}✅ ${action}: ${slug}    \n${colors.reset}`)
      
    } catch (e) {
      process.stdout.write(`\r${colors.red}  ❌ Failed to process ${fileName}: ${e}    \n${colors.reset}`)
      this.stats.failed++
    }
  }

  private async uploadMedia(imagePath: string): Promise<string | null> {
    const relativePath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
    let fullPath = path.resolve(process.cwd(), 'public', relativePath)

    if (!fs.existsSync(fullPath)) {
      fullPath = path.resolve(this.baseDir, imagePath)
    }

    if (!fs.existsSync(fullPath)) {
      const args = process.argv.slice(2)
      const isOptional = args.includes('--optional') || args.some((a) => a.startsWith('--optional='))
      if (!isOptional) {
        console.warn(`\n    ${colors.yellow}⚠️ Image not found: ${imagePath}${colors.reset}`)
      }
      return null
    }

    const fileName = path.basename(fullPath)
    const mimeType = 'image/jpeg'

    try {
      const existing = await this.payload.find({
        collection: 'media',
        where: { filename: { equals: fileName } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        return existing.docs[0].id
      }

      const fileBuffer = fs.readFileSync(fullPath)
      const media = await this.payload.create({
        collection: 'media',
        data: { alt: fileName },
        file: {
          data: fileBuffer,
          name: fileName,
          mimetype: mimeType,
          size: fileBuffer.length,
        },
        context: { disableRevalidate: true },
      })
      return media.id
    } catch (e) {
      console.error(`\n    ${colors.red}❌ Failed to upload media ${fileName}: ${e}${colors.reset}`)
      return null
    }
  }

  private async resolveAuthors(_authors?: string[]): Promise<string[]> {
    try {
      const allUsers = await this.payload.find({
        collection: 'users',
        limit: 1,
      })
      if (allUsers.docs.length > 0) {
        return [allUsers.docs[0].id]
      }
    } catch (_e) {}
    return []
  }

  private async upsertPost(slug: string, data: any): Promise<'Created' | 'Updated'> {
    try {
      const existing = await this.payload.find({
        collection: 'posts',
        where: { slug: { equals: slug } },
        limit: 1,
      })

      const locales = ['en', 'es']

      if (existing.docs.length > 0) {
        const id = existing.docs[0].id
        for (const locale of locales) {
          await this.payload.update({
            collection: 'posts',
            id,
            data,
            locale,
            context: { disableRevalidate: true },
          })
        }
        this.stats.updated++
        return 'Updated'
      } else {
        const created = await this.payload.create({
          collection: 'posts',
          data,
          locale: 'en',
          context: { disableRevalidate: true },
        })
        await this.payload.update({
          collection: 'posts',
          id: created.id,
          data,
          locale: 'es',
          context: { disableRevalidate: true },
        })
        this.stats.imported++
        return 'Created'
      }
    } catch (e) {
      throw new Error(`DB Error upserting post ${slug}: ${e}`)
    }
  }

  private async getCategoryId(slug: string, name: string): Promise<string | null> {
    if (this.categoryCache.has(slug)) return this.categoryCache.get(slug)!

    try {
      const existing = await this.payload.find({
        collection: 'categories',
        where: { slug: { equals: slug } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        const id = existing.docs[0].id
        this.categoryCache.set(slug, id)
        return id
      }

      if (!process.stdout.isTTY || process.env.NODE_ENV === 'test') {
        return null
      }

      console.info(`\n  ${colors.yellow}⚠️ Category '${slug}' not found.${colors.reset}`)
      const answer = await askQuestion(`  Do you want to create category '${slug}'? (Y/n): `)
      if (answer.toLowerCase() === 'n') {
        return null
      }

      const titleInput = await askQuestion(`  Enter Title (default: ${name || slug}): `)
      const title = titleInput.trim() || name || slug
      const description = await askQuestion(`  Enter Description (optional): `)

      const newCat = await this.payload.create({
        collection: 'categories',
        data: {
          title,
          slug,
          description: description.trim() || undefined,
        },
        context: { disableRevalidate: true },
      })

      if (newCat && newCat.id) {
        console.info(`  ${colors.green}✅ Created new category: ${title}${colors.reset}`)
        this.categoryCache.set(slug, newCat.id)
        return newCat.id
      }
    } catch (e) {
      console.error(`  ${colors.red}❌ Error managing category ${slug}: ${e}${colors.reset}`)
    }
    return null
  }

  private async resolveRelatedPosts(slugs: string[]): Promise<string[]> {
    const ids: string[] = []
    for (const slug of slugs) {
      try {
        const found = await this.payload.find({
          collection: 'posts',
          where: { slug: { equals: slug } },
          limit: 1,
        })
        if (found.docs.length > 0) {
          ids.push(found.docs[0].id)
        }
      } catch (e) {}
    }
    return ids
  }
}

// Main Entry Point
export const importPosts = async () => {
  const importer = new PostImporter(POSTS_DIR)
  await importer.run()
  return importer.getStats()
}

if (process.env.NODE_ENV !== 'test') {
  importPosts()
    .then(() => {
      process.exit(0)
    })
    .catch((err) => {
      console.error(`\n${colors.red}Fatal error:${colors.reset}`, err)
      process.exit(1)
    })
}