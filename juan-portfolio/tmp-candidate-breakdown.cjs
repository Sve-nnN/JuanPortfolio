const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.isFile() && full.endsWith('.md')) out.push(full)
  }
  return out
}

function parseLocale(filename) {
  if (filename.endsWith('.en.md')) return 'en'
  if (filename.endsWith('.es.md')) return 'es'
  return 'es'
}

function countWords(body) {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[>#*_`\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length
}

const root = process.cwd()
const files = walk(path.join(root, 'content', 'posts'))
const threshold = 180
const items = []

for (const filePath of files) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const parsed = matter(raw)
  const body = parsed.content || ''
  const words = countWords(body)

  const placeholder = body.includes('English version coming soon.')
  const short = words > 0 && words < threshold
  if (!placeholder && !short) continue

  const relPath = path.relative(root, filePath)
  const locale = parseLocale(path.basename(filePath))

  items.push({
    relPath,
    locale,
    words,
    reason: placeholder ? 'placeholder' : 'short',
  })
}

const totals = {
  all: items.length,
  placeholder: 0,
  short: 0,
  en: 0,
  es: 0,
  enPlaceholder: 0,
  esPlaceholder: 0,
}

for (const item of items) {
  totals[item.reason] += 1
  totals[item.locale] += 1
  if (item.reason === 'placeholder') {
    if (item.locale === 'en') totals.enPlaceholder += 1
    else totals.esPlaceholder += 1
  }
}

console.log(JSON.stringify({ threshold, totals, sample: items.slice(0, 40) }, null, 2))
