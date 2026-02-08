
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { getPayload } from 'payload'
import config from '../payload.config'
import { marked } from 'marked'
import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'
import readline from 'readline'

const POSTS_DIR = path.resolve(process.cwd(), 'content/posts')

// --- Types ---

interface PostFrontmatter {
    title: string
    publishedAt?: string
    updatedAt?: string // Optional override
    categoryTitle?: string // Allow overriding category title
    authors?: string[] // IDs or Emails/Slugs (we'll try to resolve)
    relatedPosts?: string[] // Slugs
    heroImage?: string // Path to image (TODO: implement upload)
    metaTitle?: string
    metaDescription?: string
}

interface ImportStats {
    imported: number
    updated: number
    failed: number
    skipped: number
}

// --- Helpers ---

/**
 * Validates frontmatter data.
 * Returns null if valid, or error message string if invalid.
 */
const validateFrontmatter = (data: Partial<PostFrontmatter>, fileName: string): string | null => {
    if (!data.title) {
        return `Missing 'title' in ${fileName}`
    }
    return null
}

/**
 * Converts Markdown string to Lexical SerializedEditorState.
 * This is a simplified converter. For full fidelity, a more robust parser is needed.
 */
const convertMarkdownToLexical = (markdown: string): SerializedEditorState => {
    const tokens = marked.lexer(markdown)

    const rootChildren: SerializedLexicalNode[] = []

    // Helper to parse inline tokens (strong, em, link, text)
    const parseInline = (appendedTokens: any[]): SerializedLexicalNode[] => {
        const nodes: SerializedLexicalNode[] = []

        appendedTokens.forEach(token => {
            if (token.type === 'text') {
                // Check if text token has tokens (formatting inside text)
                if (token.tokens) {
                    nodes.push(...parseInline(token.tokens))
                } else {
                    // Plain text map decoded entities if needed
                    nodes.push({
                        type: 'text',
                        text: token.text,
                        format: 0,
                        detail: 0,
                        mode: 0,
                        style: '',
                        version: 1
                    })
                }
            } else if (token.type === 'strong') {
                // Bold
                const children = parseInline(token.tokens)
                children.forEach(child => {
                    if (child.type === 'text') {
                        child.format = (child.format || 0) | 1 // IS_BOLD
                    }
                })
                nodes.push(...children)
            } else if (token.type === 'em') {
                // Italic
                const children = parseInline(token.tokens)
                children.forEach(child => {
                    if (child.type === 'text') {
                        child.format = (child.format || 0) | 2 // IS_ITALIC
                    }
                })
                nodes.push(...children)
            } else if (token.type === 'codespan') {
                // Inline Code
                nodes.push({
                    type: 'text',
                    text: token.text,
                    format: 16, // IS_CODE
                    detail: 0,
                    mode: 0,
                    style: '',
                    version: 1
                })
            } else if (token.type === 'link') {
                // Link
                nodes.push({
                    type: 'link',
                    format: '',
                    indent: 0,
                    version: 1,
                    fields: {
                        linkType: 'custom',
                        newTab: false,
                        url: token.href
                    },
                    children: parseInline(token.tokens),
                    direction: 'ltr'
                } as any)
            }
            // Add more inline types if needed
        })
        return nodes
    }

    tokens.forEach(token => {
        if (token.type === 'heading') {
            // Headings also have 'tokens' for inline parsing
            rootChildren.push({
                type: 'heading',
                tag: `h${token.depth}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
                format: '',
                indent: 0,
                version: 1,
                children: parseInline((token as any).tokens || []),
                direction: 'ltr'
            })
        } else if (token.type === 'paragraph') {
            // Paragraphs have 'tokens'
            rootChildren.push({
                type: 'paragraph',
                format: '',
                indent: 0,
                version: 1,
                children: parseInline((token as any).tokens || []),
                direction: 'ltr'
            })
        } else if (token.type === 'list') {
            const listNode = {
                type: 'list',
                listType: token.ordered ? 'number' : 'bullet',
                start: (token.ordered && token.start) ? token.start : 1,
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
                    children: parseInline(item.tokens || []), // List items have tokens too
                    direction: 'ltr'
                })),
                direction: 'ltr'
            }
            rootChildren.push(listNode as any)
        } else if (token.type === 'blockquote') {
            // Handle Blockquotes
            rootChildren.push({
                type: 'quote',
                format: '',
                indent: 0,
                version: 1,
                children: parseInline((token as any).tokens || []),
                direction: 'ltr'
            } as any)
        } else if (token.type === 'code') {
            const langMap: Record<string, string> = {
                'ts': 'typescript',
                'tsx': 'typescript',
                'js': 'javascript',
                'jsx': 'javascript',
                'css': 'css'
            }
            const mappedLang = langMap[token.lang || ''] || 'typescript'

            // Clean up code content (trim extra newlines if needed, but keep formatting)
            const codeContent = token.text

            rootChildren.push({
                type: 'block',
                format: '',
                indent: 0,
                version: 2,
                fields: {
                    id: new Date().getTime().toString() + Math.random().toString(36).substring(7),
                    blockType: 'code-block',
                    code: codeContent,
                    language: mappedLang,
                }
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
            direction: 'ltr'
        }
    }
}

// --- CLI Helper ---

const askQuestion = (query: string): Promise<string> => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

// --- Importer Class ---

class PostImporter {
    private categoryCache = new Map<string, string>()
    private stats: ImportStats = { imported: 0, updated: 0, failed: 0, skipped: 0 }
    private payload: any
    private baseDir: string

    constructor(baseDir: string) {
        this.baseDir = baseDir
    }

    public getStats(): ImportStats {
        return { ...this.stats }
    }

    public async init() {
        console.log('⏳ Initializing Payload...')
        console.log('   DATABASE_URI:', process.env.DATABASE_URI ? '******' : 'UNDEFINED')
        try {
            this.payload = await getPayload({ config })
            console.log('✅ Payload initialized successfully')
        } catch (e) {
            console.error('❌ Failed to init Payload:', e)
            throw e
        }
    }

    public async run() {
        console.log('🏃‍♂️ Entering run() method...')
        if (!this.payload) {
            console.log('   Payload not ready, calling init()...')
            await this.init()
        }

        console.log(`Starting post import from: ${this.baseDir}`)
        if (!fs.existsSync(this.baseDir)) {
            console.warn(`Posts directory not found: ${this.baseDir}`)
            return
        }
        await this.processDirectory(this.baseDir)
        console.info('Import completed.')
        console.info('Stats:', this.stats)
    }

    private async processDirectory(dir: string) {
        // Parse CLI args
        const args = process.argv.slice(2)
        const fileArgIndex = args.findIndex(arg => arg.startsWith('--file='))
        const targetFile = fileArgIndex !== -1 ? args[fileArgIndex].split('=')[1] : null

        // Find standalone file name if passed without flag (e.g. "importPosts.ts my-post.md")
        const standaloneFile = args.find(arg => arg.endsWith('.md') && !arg.startsWith('--'))

        const fileToProcess = targetFile || standaloneFile

        const files = fs.readdirSync(dir)

        if (!fileToProcess) {
            console.info(`Scanning directory: ${dir} (${files.length} files)`)
        } else {
            console.info(`🔍 Filtering for file: ${fileToProcess}`)
        }

        for (const file of files) {
            const filePath = path.join(dir, file)
            const stat = fs.statSync(filePath)

            if (stat.isDirectory()) {
                await this.processDirectory(filePath)
                continue
            }

            if (!file.endsWith('.md')) continue

            // Filter if argument provided
            if (fileToProcess && file !== fileToProcess && file !== `${fileToProcess}.md`) {
                continue
            }

            await this.processFile(filePath, dir)
        }
    }

    private async processFile(filePath: string, dir: string) {
        const fileName = path.basename(filePath)
        console.info(`Processing file: ${fileName}`)
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8')
            const { data, content } = matter(fileContent)
            const frontmatter = data as PostFrontmatter

            // Validation
            const validationError = validateFrontmatter(frontmatter, fileName)
            if (validationError) {
                console.error(`Validation Error: ${validationError}`)
                this.stats.failed++
                return
            }

            const slug = fileName.replace('.md', '')

            // Determine Category
            // If file is in root POSTS_DIR, it has no specific category (or uses default 'uncategorized' if forced, but here we skip)
            const isRoot = dir === POSTS_DIR
            const categorySlug = isRoot ? null : path.basename(dir)

            // Resolve Relationships
            let categoryId: string | null = null
            if (categorySlug) {
                categoryId = await this.getCategoryId(categorySlug, frontmatter.categoryTitle || categorySlug)
            } else if (frontmatter.categoryTitle) {
                // If in root but has explicit category title in frontmatter, try to find/create it by that title?
                // For now, let's respect that "posts" folder itself isn't a category.
                // If user wants "Full Stack" category for root post, they might need to move it to a folder or we handle frontmatter override.
                // Let's support frontmatter override even in root.
                // But we need a slug. "Full Stack" -> "full-stack"
                // The current getCategoryId takes (slug, name).
                // If we don't have a folder slug, we might need to slugify the title.
                // For safety, let's just skip category if in root for now unless we add slugify logic.
                // Wait, existing logic was: categorySlug = match basename.
                // User said "posts is not a category".

                // New Logic: 
                // Only infer category from directory if NOT root.
                // If in root, categoryId is null.
            }

            const relatedPostIds = frontmatter.relatedPosts
                ? await this.resolveRelatedPosts(frontmatter.relatedPosts)
                : []

            // Resolve Hero Image
            let heroImageId: string | null = null
            if (frontmatter.heroImage) {
                heroImageId = await this.uploadMedia(frontmatter.heroImage)
            }

            // Resolve Authors
            const authorIds = await this.resolveAuthors(frontmatter.authors)

            // Convert Content
            const lexicalContent = convertMarkdownToLexical(content)

            // Prepare Payload Data

            // Clean content for description
            // Remove markdown syntax like #, *, [, ], (, ), >, -
            const cleanContent = content
                .replace(/[#*\[\]()_>]/g, '') // Remove basic markdown chars
                .replace(/- /g, '') // Remove list bullets
                .replace(/\n+/g, ' ') // Replace newlines with spaces
                .replace(/\s+/g, ' ') // Collapse multiple spaces
                .trim()

            const metaTitle = frontmatter.metaTitle || frontmatter.title
            const metaDescription = frontmatter.metaDescription || (cleanContent.slice(0, 140) + (cleanContent.length > 140 ? '...' : ''))

            const postData: any = {
                title: frontmatter.title,
                slug: slug,
                content: {
                    content: lexicalContent,
                    heroImage: heroImageId,
                },
                publishedAt: frontmatter.publishedAt ? new Date(frontmatter.publishedAt).toISOString() : new Date().toISOString(),
                relatedPosts: relatedPostIds,
                authors: authorIds,
                // SEO Metadata
                meta: {
                    title: metaTitle,
                    description: metaDescription,
                    image: heroImageId
                }
            }

            if (categoryId) {
                postData.categories = [categoryId] // In 'Meta' tab but usually at root of data object for API
                // Double check schema: categories is in fields array (tabbed), so it IS at root of data.
            }

            // Upsert Post
            await this.upsertPost(slug, postData)

        } catch (e) {
            console.error(`Failed to process ${fileName}:`, e)
            this.stats.failed++
        }
    }

    private async uploadMedia(imagePath: string): Promise<string | null> {
        // Remove leading slash if present to make path relative to cwd
        const relativePath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
        // Try public folder first
        let fullPath = path.resolve(process.cwd(), 'public', relativePath)

        if (!fs.existsSync(fullPath)) {
            // Try relative to baseDir?
            fullPath = path.resolve(this.baseDir, imagePath)
        }

        if (!fs.existsSync(fullPath)) {
            // Check if strict mode is disabled via flag
            const args = process.argv.slice(2)
            const isOptional = args.includes('--optional') || args.some(a => a.startsWith('--optional='))

            if (isOptional) {
                console.warn(`⚠️ Image not found (optional): ${imagePath}`)
                return null
            } else {
                console.error(`❌ Image not found: ${imagePath}`)
                return null // Still return null to avoid crash, but log error
            }
        }

        const fileName = path.basename(fullPath)
        const mimeType = 'image/jpeg' // TODO: detect mime type properly if needed

        try {
            // Check if exists
            const existing = await this.payload.find({
                collection: 'media',
                where: { filename: { equals: fileName } },
                limit: 1
            })

            if (existing.docs.length > 0) {
                return existing.docs[0].id
            }

            const fileBuffer = fs.readFileSync(fullPath)

            const media = await this.payload.create({
                collection: 'media',
                data: {
                    alt: fileName,
                },
                file: {
                    data: fileBuffer,
                    name: fileName,
                    mimetype: mimeType,
                    size: fileBuffer.length
                }
            })
            console.info(`✅ Uploaded media: ${fileName}`)
            return media.id
        } catch (e) {
            console.error(`❌ Failed to upload media ${fileName}:`, e)
            return null
        }
    }

    private async resolveAuthors(authors?: string[]): Promise<string[]> {
        // If authors provided, try to find them. 
        // For now, if no authors or invalid, stick to ANY existing user (e.g. the first one)
        // just to satisfy the field if needed, or leave empty if strict.
        // Given the error, we want A valid author.

        try {
            const allUsers = await this.payload.find({
                collection: 'users',
                limit: 1,
            })

            if (allUsers.docs.length > 0) {
                return [allUsers.docs[0].id]
            }
        } catch (e) {
            console.warn('Could not resolve any users for authors.')
        }
        return []
    }

    private async upsertPost(slug: string, data: any) {
        try {
            const existing = await this.payload.find({
                collection: 'posts',
                where: { slug: { equals: slug } },
                limit: 1
            })

            // We want to write to ALL locales to ensure it shows up in "Español"
            // We can do this by wrapping localized fields in the data object 
            // BUT Payload Local API expects a specific locale context.
            // Best way: Update for 'en', then Update for 'es'.

            const locales = ['en', 'es']

            if (existing.docs.length > 0) {
                const id = existing.docs[0].id
                for (const locale of locales) {
                    await this.payload.update({
                        collection: 'posts',
                        id,
                        data,
                        locale
                    })
                }
                console.info(`Updated post: ${slug}`)
                this.stats.updated++
            } else {
                // Create first (default locale)
                const created = await this.payload.create({
                    collection: 'posts',
                    data,
                    locale: 'en' // create in default
                })

                // Then update 'es'
                await this.payload.update({
                    collection: 'posts',
                    id: created.id,
                    data,
                    locale: 'es'
                })

                console.info(`Created post: ${slug}`)
                this.stats.imported++
            }
        } catch (e) {
            throw new Error(`DB Error upserting post ${slug}: ${e}`)
        }
    }

    private async getCategoryId(slug: string, name: string): Promise<string | null> {
        if (this.categoryCache.has(slug)) return this.categoryCache.get(slug)!

        try {
            // Try to find existing category
            const existing = await this.payload.find({
                collection: 'categories',
                where: { slug: { equals: slug } },
                limit: 1
            })

            if (existing.docs.length > 0) {
                const id = existing.docs[0].id
                this.categoryCache.set(slug, id)
                return id
            }

            // Category not found
            console.info(`\n⚠️ Category '${slug}' not found.`)

            // If running in non-interactive mode (e.g. tests or CI), we might want to skip or default.
            // But user asked for interactive terminal prompts.
            // We'll check if we have a TTY.
            if (!process.stdout.isTTY) {
                console.warn(`Non-interactive terminal. Skipping category creation for '${slug}'.`)
                return null
            }

            const answer = await askQuestion(`Do you want to create category '${slug}'? (Y/n): `)
            if (answer.toLowerCase() === 'n') {
                console.warn(`Skipping category '${slug}'.`)
                return null
            }

            const titleInput = await askQuestion(`Enter Title (default: ${name || slug}): `)
            const title = titleInput.trim() || name || slug

            const description = await askQuestion(`Enter Description (optional): `)

            // Create new
            const newCat = await this.payload.create({
                collection: 'categories',
                data: {
                    title,
                    description: description.trim() || undefined
                }
            })

            if (newCat && newCat.id) {
                console.info(`✅ Created new category: ${title}`)
                this.categoryCache.set(slug, newCat.id)
                return newCat.id
            }
        } catch (e) {
            console.error(`Error managing category ${slug}:`, e)
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
                    limit: 1
                })
                if (found.docs.length > 0) {
                    ids.push(found.docs[0].id)
                } else {
                    console.warn(`Related post not found: ${slug}`)
                }
            } catch (e) {
                console.error(`Error finding related post ${slug}:`, e)
            }
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

// Auto-execute if run as a script and not in test environment
console.log('🔍 Checking execution environment...')
console.log('LOG: process.env.NODE_ENV =', process.env.NODE_ENV)

if (process.env.NODE_ENV !== 'test') {
    console.log('🚀 Starting importPosts execution...')
    importPosts().then(() => {
        console.log('✅ process.exit(0)')
        process.exit(0)
    }).catch((err) => {
        console.error('❌ Error executing importPosts:', err)
        process.exit(1)
    })
} else {
    console.log('ℹ️ Skipping execution (test environment detected)')
}
