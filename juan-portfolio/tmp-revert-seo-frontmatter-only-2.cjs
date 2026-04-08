const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

const cwd = process.cwd()
const repoDirName = path.basename(cwd)
const head = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
const base = execSync(`git rev-parse ${head}^`, { encoding: 'utf8' }).trim()

const changedRaw = execSync(`git diff --name-only ${base} ${head} -- content/posts`, { encoding: 'utf8' }).trim()
const changed = changedRaw ? changedRaw.split(/\r?\n/).filter(Boolean) : []

let seen = 0
let touched = 0
let reverted = 0

for (const relMaybePrefixed of changed) {
  seen += 1

  const rel = relMaybePrefixed.startsWith(`${repoDirName}/`)
    ? relMaybePrefixed.slice(repoDirName.length + 1)
    : relMaybePrefixed

  const abs = path.join(cwd, rel)
  if (!fs.existsSync(abs)) continue

  let prevRaw
  try {
    prevRaw = execSync(`git show ${base}:${relMaybePrefixed}`, { encoding: 'utf8' })
  } catch {
    continue
  }

  const curRaw = fs.readFileSync(abs, 'utf8')
  const prev = matter(prevRaw)
  const cur = matter(curRaw)

  const prevData = prev.data || {}
  const curData = cur.data || {}

  const hasAny = ['title', 'metaTitle', 'metaDescription'].some((k) => Object.prototype.hasOwnProperty.call(prevData, k))
  if (!hasAny) continue

  touched += 1
  const nextData = { ...curData }
  let changedFile = false

  for (const key of ['title', 'metaTitle', 'metaDescription']) {
    if (!Object.prototype.hasOwnProperty.call(prevData, key)) continue
    const before = JSON.stringify(curData[key] ?? '')
    const after = JSON.stringify(prevData[key] ?? '')
    if (before !== after) {
      nextData[key] = prevData[key]
      changedFile = true
    }
  }

  if (changedFile) {
    fs.writeFileSync(abs, matter.stringify(cur.content, nextData), 'utf8')
    reverted += 1
  }
}

console.log(`head=${head}`)
console.log(`base=${base}`)
console.log(`files_seen=${seen}`)
console.log(`files_with_frontmatter=${touched}`)
console.log(`files_reverted=${reverted}`)
