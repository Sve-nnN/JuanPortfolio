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

const root = process.cwd()
const files = walk(path.join(root, 'content', 'posts'))
const hints = [
  ' de ',
  ' para ',
  ' con ',
  ' como ',
  ' guia ',
  ' usuario ',
  ' diseno ',
  ' arboles ',
  ' complejidad ',
  ' dinamica ',
  ' experiencia ',
  ' redaccion ',
  ' enlaces internos ',
]

const suspicious = []
for (const filePath of files) {
  const relPath = path.relative(root, filePath)
  const parsed = matter(fs.readFileSync(filePath, 'utf8'))
  const keyword = String(parsed.data?.keyword || '').trim()
  const low = ` ${keyword.toLowerCase()} `
  if (keyword && hints.some((h) => low.includes(h))) suspicious.push({ relPath, keyword })
}

console.log(JSON.stringify({ totalEn: files.length, suspicious: suspicious.length, items: suspicious }, null, 2))
