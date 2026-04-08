const fs = require('fs')

const filePath = 'src/scripts/dinorank/DinoBrainApiAdapter.ts'
let source = fs.readFileSync(filePath, 'utf8')

const oldBlock = `    const selectedKeywords = await this.parseDataListFromHtml(step1Html, '.dbpro-longtail-check', 'data-keyword', 6)
    if (selectedKeywords.length === 0) {
      throw new Error('pro-step1 did not return selectable long-tail keywords')
    }`

const newBlock = `    const selectedKeywords = await this.parseStep1Keywords(step1Html, keyword, 6)`

if (!source.includes(newBlock)) {
  source = source.replace(oldBlock, newBlock)
}

if (!source.includes('private async parseStep1Keywords(')) {
  const anchor = '  private async parseProFieldsFromHtml('
  const insert = `  private async parseStep1Keywords(html: string, fallbackKeyword: string, limit: number): Promise<string[]> {
    const { JSDOM } = await import('jsdom')
    const dom = new JSDOM(html)
    const document = dom.window.document

    const candidates = [
      ...Array.from(document.querySelectorAll('.dbpro-longtail-check[data-keyword]')).map(node => node.getAttribute('data-keyword') || ''),
      ...Array.from(document.querySelectorAll('[data-keyword]')).map(node => node.getAttribute('data-keyword') || ''),
      ...Array.from(document.querySelectorAll('input[name="selected_keywords"]')).map(node => (node as HTMLInputElement).value || ''),
      ...Array.from(document.querySelectorAll('input[type="checkbox"][value]')).map(node => (node as HTMLInputElement).value || ''),
    ]

    const seen = new Set<string>()
    const normalized = candidates
      .map(value => value.replace(/\\s+/g, ' ').trim())
      .filter(Boolean)
      .filter(value => {
        const key = value.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, limit)

    if (normalized.length > 0) {
      return normalized
    }

    // Fallback: keep flow alive when DinoRank step1 returns no selectable long-tail list.
    return [fallbackKeyword.trim()].filter(Boolean)
  }

`
  source = source.replace(anchor, insert + anchor)
}

fs.writeFileSync(filePath, source, 'utf8')
console.log('patched', filePath)
