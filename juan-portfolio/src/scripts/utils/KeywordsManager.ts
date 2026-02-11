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

    const updatedLines = lines.map((line) => {
      if (line.startsWith('|') && !line.includes('---') && !line.includes('Keyword')) {
        const parts = line.split('|')
        // parts[0] is empty because line starts with |
        // parts[1] is Keyword
        // parts[2] is Target URL
        // parts[6] is Status (index 5 if we don't count the first empty part)
        
        const rowTargetUrl = parts[2]?.trim()
        
        if (rowTargetUrl === targetUrl) {
          // Update Status column (Index 6 because of leading |)
          parts[6] = ` ${status} `
          // Update Last Updated column (Index 7)
          parts[7] = ` ${new Date().toISOString().split('T')[0]} `
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
