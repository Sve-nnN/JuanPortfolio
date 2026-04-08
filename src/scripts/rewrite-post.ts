import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { spawnSync } from 'child_process'
import matter from 'gray-matter'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { DinoBrainApiAdapter } from './dinorank/DinoBrainApiAdapter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '../..')
dotenv.config({ path: join(ROOT, '.env') })

async function rewritePost(filePath: string, seoMetadata?: any) {
  const absolutePath = resolve(ROOT, filePath)
  if (!existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`)
  }

  console.log(`\n--- Rewriting Post: ${filePath} ---`)

  const fileContent = readFileSync(absolutePath, 'utf-8')
  const { data } = matter(fileContent)

  const keyword = data.keyword
  const locale = data.idioma || (filePath.endsWith('.en.md') ? 'en' : 'es')

  if (!keyword) {
    throw new Error(`No keyword found in frontmatter for ${filePath}`)
  }

  console.log(`Keyword: ${keyword} | Locale: ${locale}`)

  // 1. Generate Content with DinoBrain
  const dinoBrain = new DinoBrainApiAdapter()
  console.log('Generating content with DinoBrain (this may take a few minutes)...')
  
  const dinoResult = await dinoBrain.generate({
    keyword,
    language: locale,
    numWords: 2000,
    country: locale === 'en' ? 'US' : 'ES'
  })

  console.log(`Content generated! (${dinoResult.markdown.split(/\s+/).length} words)`)

  // 2. Assemble and Save
  const mergedFrontmatter = {
    ...data,
    ...(seoMetadata || {}),
    updatedAt: new Date().toISOString(),
    uploaded: false
  }

  const newFileContent = matter.stringify(dinoResult.markdown, mergedFrontmatter)
  writeFileSync(absolutePath, newFileContent)
  console.log(`Saved: ${filePath}`)

  // 3. Sync to Payload
  console.log('Syncing to Payload CMS...')
  const relativeToPosts = filePath.replace(/^content\/posts\//, '')
  spawnSync('pnpm', ['sync', 'push', '--', `--post=${relativeToPosts}`, '--force'], { 
    cwd: ROOT, 
    stdio: 'inherit', 
    shell: true 
  })

  console.log(`\n✅ Finished: ${filePath}\n`)
}

// Simple CLI wrapper for DinoBrain content only
const targetFile = process.stdout.isTTY ? process.argv[2] : process.argv[2]
const seoDataJson = process.argv[3]
if (targetFile) {
  let seoData;
  try {
    seoData = seoDataJson ? JSON.parse(seoDataJson) : undefined
  } catch (e) {
    console.warn('Warning: Failed to parse SEO JSON data.')
  }
  rewritePost(targetFile, seoData).catch(err => {
    console.error('FAILED:', err)
    process.exit(1)
  })
}

export { rewritePost }
