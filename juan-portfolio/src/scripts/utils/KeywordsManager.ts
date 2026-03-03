import fs from 'fs'
import path from 'path'

export class KeywordsManager {
  private keywordsPath: string

  constructor() {
    this.keywordsPath = path.resolve(process.cwd(), 'content/keywords.md')
  }

  /**
   * Updates the status of a keyword based on its target URL
   */
  public updateStatusByUrl(targetUrl: string, status: string): boolean {
    if (!fs.existsSync(this.keywordsPath)) {
      console.warn(`⚠️ keywords.md not found at ${this.keywordsPath}`)
      return false
    }

    const content = fs.readFileSync(this.keywordsPath, 'utf-8')
    const lines = content.split('\n')
    let modified = false

    let targetUrlIdx = -1
    let statusIdx = -1
    let lastUpdatedIdx = -1

    const updatedLines = lines.map((line) => {
      // Find the header row to extract column indexes
      if (line.includes('| Keyword') && line.trim().startsWith('|')) {
        const headers = line.split('|').map((h) => h.trim().toLowerCase())
        targetUrlIdx = headers.indexOf('target url')
        statusIdx = headers.indexOf('status')
        lastUpdatedIdx = headers.indexOf('last updated')
        return line
      }

      if (line.startsWith('|') && !line.includes('---') && targetUrlIdx !== -1) {
        const parts = line.split('|')

        const rowTargetUrl = parts[targetUrlIdx]?.trim()

        if (rowTargetUrl === targetUrl && statusIdx !== -1 && lastUpdatedIdx !== -1) {
          parts[statusIdx] = ` ${status} `
          parts[lastUpdatedIdx] = ` ${new Date().toISOString().split('T')[0]} `
          modified = true
          return parts.join('|')
        }
      }
      return line
    })

    if (modified) {
      fs.writeFileSync(this.keywordsPath, updatedLines.join('\n'), 'utf-8')
      return true
    }

    return false
  }
}
