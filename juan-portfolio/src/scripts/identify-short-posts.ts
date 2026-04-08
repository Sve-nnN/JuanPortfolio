import { readFileSync, readdirSync, statSync } from 'fs'
import { join, resolve } from 'path'
import { globSync } from 'glob'
import matter from 'gray-matter'

const ROOT = resolve(process.cwd())
const POSTS_DIR = join(ROOT, 'content/posts')

function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function identifyShortPosts() {
  const files = globSync('**/*.md', { cwd: POSTS_DIR, absolute: true })
  const results: any[] = []

  for (const file of files) {
    const content = readFileSync(file, 'utf-8')
    const { data, content: body } = matter(content)
    const wordCount = getWordCount(body)

    if (wordCount < 1000) {
      const fileName = file.split('/').pop() || ''
      let locale = data.idioma || 'es'
      if (fileName.endsWith('.en.md')) locale = 'en'
      if (fileName.endsWith('.es.md')) locale = 'es'

      results.push({
        file: file.replace(ROOT, ''),
        keyword: data.keyword || 'NO_KEYWORD',
        locale,
        wordCount,
        title: data.title || 'NO_TITLE'
      })
    }
  }

  // Sort by wordCount
  results.sort((a, b) => a.wordCount - b.wordCount)

  console.log('| File | Keyword | Locale | Word Count | Title |')
  console.log('| --- | --- | --- | --- | --- |')
  results.forEach(r => {
    console.log(`| ${r.file} | ${r.keyword} | ${r.locale} | ${r.wordCount} | ${r.title} |`)
  })

  console.log(`\nTotal posts with < 1000 words: ${results.length}`)
}

identifyShortPosts()
