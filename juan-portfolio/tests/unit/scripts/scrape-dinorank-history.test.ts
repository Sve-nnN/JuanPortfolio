import { describe, it, expect } from 'vitest'
import { JSDOM } from 'jsdom'

// Versión corregida de la lógica de detección
function detectHistoryState(document: Document, keywords: string[]) {
  const table = document.querySelector('table.dataT') || document.querySelector('#historicalKresearch')
  if (!table) return false
  const rows = Array.from(table.querySelectorAll('tr'))
  return rows.some(tr => {
    const text = tr.textContent?.toLowerCase() || ''
    const hasSeeAnalysis = text.includes('see analysis')
    const hasKeyword = keywords.some(k => text.includes(k.toLowerCase()))
    return hasSeeAnalysis && hasKeyword
  })
}

describe('DinoRank History Table Logic', () => {
  it('detects a keyword that was already analyzed in the history table', () => {
    const html = `
      <table class="dataT">
        <tr>
          <td>web performance optimization</td>
          <td>04/03/2026</td>
          <td class="actions">
            <div onclick="kresarch('...','3837897')">See analysis</div>
          </td>
        </tr>
      </table>
    `
    const dom = new JSDOM(html)
    const found = detectHistoryState(dom.window.document, ['web performance optimization'])
    expect(found).toBe(true)
  })

  it('returns false if the keyword is not in the history table', () => {
    const html = `<table class="dataT"><tr><td>otra cosa</td><td>See analysis</td></tr></table>`
    const dom = new JSDOM(html)
    const found = detectHistoryState(dom.window.document, ['keyword nueva'])
    expect(found).toBe(false)
  })
})
