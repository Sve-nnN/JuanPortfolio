const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.isFile() && full.endsWith('.en.md')) out.push(full)
  }
  return out
}

function parseBacklog(filePath) {
  const text = fs.readFileSync(filePath, 'utf8')
  const map = new Map()

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line.startsWith('|') || line.startsWith('| :---')) continue

    const cols = line.split('|').slice(1, -1).map((c) => c.trim())
    if (cols.length < 3) continue

    const keyword = cols[0]
    const targetUrl = cols[1]
    const language = (cols[2] || '').toLowerCase()

    if (!keyword || keyword.toLowerCase() === 'keyword') continue
    if (!targetUrl.startsWith('/')) continue

    const parts = targetUrl.replace(/^\//, '').split('/').filter(Boolean)
    if (parts.length < 2) continue

    const category = parts[0]
    const slug = parts[1]
    const locale = language === 'en' ? 'en' : 'es'
    map.set(`${locale}:${category}:${slug}`, keyword)
  }

  return map
}

const root = process.cwd()
const files = walk(path.join(root, 'content', 'posts'))
const keywordMap = parseBacklog(path.join(root, 'content', 'keywords_backlog.md'))

const mismatches = []

for (const filePath of files) {
  const relPath = path.relative(root, filePath)
  const parsed = matter(fs.readFileSync(filePath, 'utf8'))
  const currentKeyword = String(parsed.data?.keyword || '').trim()

  const category = relPath.split(path.sep)[2]
  const slug = path.basename(filePath).replace(/\.en\.md$/, '')
  const expected = keywordMap.get(`en:${category}:${slug}`) || ''

  if (expected && currentKeyword && currentKeyword !== expected) {
    mismatches.push({ relPath, currentKeyword, expected })
  }
}

console.log(JSON.stringify({ totalEn: files.length, mismatches: mismatches.length, items: mismatches }, null, 2))
