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
let candidate = 0
let reverted = 0
let skippedInvalid = 0

for (const relMaybePrefixed of changed) {
  seen += 1

  const rel = relMaybePrefixed.startsWith(`${repoDirName}/`)
    ? relMaybePrefixed.slice(repoDirName.length + 1)
    : relMaybePrefixed

  const abs = path.join(cwd, rel)
  if (!fs.existsSync(abs)) continue

  const curRaw = fs.readFileSync(abs, 'utf8')
  if (!curRaw.startsWith('---')) continue

  let prevRaw
  try {
    prevRaw = execSync(`git show ${base}:${relMaybePrefixed}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    })
  } catch {
    continue
  }

  if (!prevRaw.startsWith('---')) continue

  let prev
  let cur
  try {
    prev = matter(prevRaw)
    cur = matter(curRaw)
  } catch {
    skippedInvalid += 1
    continue
  }

  const prevData = prev.data || {}
  const curData = cur.data || {}

  const hasAny = ['title', 'metaTitle', 'metaDescription'].some((k) => Object.prototype.hasOwnProperty.call(prevData, k))
  if (!hasAny) continue

  candidate += 1
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
console.log(`files_candidate=${candidate}`)
console.log(`files_reverted=${reverted}`)
console.log(`files_skipped_invalid=${skippedInvalid}`)
