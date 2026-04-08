const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

const replacements = {
  'algoritmos-estructuras-datos': 'algorithms and data structures',
  'arboles-binarios': 'binary trees',
  'complejidad-algoritmica': 'algorithm complexity',
  'diseno-bases-datos': 'database design',
  'experiencia-de-usuario': 'user experience',
  'programacion-dinamica': 'dynamic programming',
  'enlaces-internos-guia': 'internal linking guide',
  'estrategia-topic-clusters': 'topic cluster strategy',
  'guia-eeat': 'eeat guide',
  'guia-keyword-research': 'keyword research guide',
  'redaccion-seo': 'seo copywriting'
}

function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.isFile() && full.endsWith('.en.md')) out.push(full)
  }
  return out
}

function cleanText(input) {
  return String(input || '').replace(/\s+/g, ' ').trim()
}

const root = process.cwd()
const files = walk(path.join(root, 'content', 'posts'))

let changed = 0
for (const filePath of files) {
  const slug = path.basename(filePath).replace(/\.en\.md$/, '')
  const nextKeyword = replacements[slug]
  if (!nextKeyword) continue

  const raw = fs.readFileSync(filePath, 'utf8')
  const parsed = matter(raw)
  const prevKeyword = cleanText(parsed.data?.keyword)

  if (!prevKeyword || prevKeyword === nextKeyword) continue

  parsed.data.keyword = nextKeyword

  const prevMeta = cleanText(parsed.data?.metaDescription)
  if (prevMeta) {
    const escaped = prevKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(escaped, 'ig')
    parsed.data.metaDescription = prevMeta.replace(re, nextKeyword)
  }

  fs.writeFileSync(filePath, matter.stringify(parsed.content, parsed.data), 'utf8')
  changed += 1
  console.log(`updated ${path.relative(root, filePath)}: "${prevKeyword}" -> "${nextKeyword}"`)
}

console.log(`changed=${changed}`)
