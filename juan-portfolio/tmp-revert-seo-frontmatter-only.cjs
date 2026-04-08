const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

const repoDirName = path.basename(process.cwd())
const targetCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
const parentCommit = execSync(`git rev-parse ${targetCommit}^`, { encoding: 'utf8' }).trim()

const changedFilesRaw = execSync(
  `git diff --name-only ${parentCommit} ${targetCommit} -- content/posts`,
  { encoding: 'utf8' },
).trim()

const files = changedFilesRaw ? changedFilesRaw.split(/\r?\n/).filter(Boolean) : []
let touched = 0
let reverted = 0

for (const rel of files) {
  const abs = path.join(process.cwd(), rel)
  if (!fs.existsSync(abs)) continue

  const gitPath = `${repoDirName}/${rel}`

  let prevRaw
  try {
    prevRaw = execSync(`git show ${parentCommit}:${gitPath}`, { encoding: 'utf8' })
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
  let fileChanged = false

  for (const key of ['title', 'metaTitle', 'metaDescription']) {
    if (!Object.prototype.hasOwnProperty.call(prevData, key)) continue
    const before = String(curData[key] ?? '')
    const after = String(prevData[key] ?? '')
    if (before !== after) {
      nextData[key] = prevData[key]
      fileChanged = true
    }
  }

  if (fileChanged) {
    const nextRaw = matter.stringify(cur.content, nextData)
    fs.writeFileSync(abs, nextRaw, 'utf8')
    reverted += 1
  }
}

console.log(`commit=${targetCommit}`)
console.log(`baseline=${parentCommit}`)
console.log(`files_seen=${files.length}`)
console.log(`files_touched=${touched}`)
console.log(`files_reverted=${reverted}`)
