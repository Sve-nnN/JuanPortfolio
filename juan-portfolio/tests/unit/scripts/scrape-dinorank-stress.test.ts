import { describe, it, expect } from 'vitest'
import { JSDOM } from 'jsdom'

// Nueva lógica de extracción robusta 2026
function extractionLogic(rows: HTMLElement[]) {
  const aiSuggestions: any[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const tdCells = Array.from(row.querySelectorAll('td'))
    if (tdCells.length < 2) continue

    // 1. Extraer Keyword con prioridad: primer enlace o texto no numérico más largo
    let txt = ''
    const link = row.querySelector('a')
    if (link && link.textContent?.trim()) {
      txt = link.textContent.trim().split(/[\n\r]/)[0]!
    } else {
      // Si no hay link, buscamos en los fragmentos de texto
      const fragments = (tdCells[0]?.textContent || '').split(/[\n\r]|\s{2,}/).map(f => f.trim()).filter(f => f.length > 1)
      // Escogemos el fragmento más largo que no sea puramente numérico
      txt = fragments.sort((a, b) => b.length - a.length).find(f => !/^\d+$/.test(f.replace(/\./g, ''))) || ''
    }

    if (!txt || txt.toLowerCase().includes('keywords') || txt.length > 100) continue

    // 2. Extraer métricas por contenido
    let volume = '0', cpc = '0', competency = '0'
    for (const cell of tdCells) {
      const cellText = cell.textContent?.trim() || ''
      if (!cellText) continue

      if (cellText.includes('Baja') || cellText.includes('Media') || cellText.includes('Alta')) {
        const m = cellText.match(/[\d,.]+/)
        if (m) competency = m[0].replace(',', '.')
        continue
      }

      if (cellText.includes('€') || cellText.includes('CPC:')) {
        const m = cellText.match(/[\d,.]+/)
        if (m) cpc = m[0].replace(',', '.')
        continue
      }

      // Volumen: Lógica agresiva corregida
      const possibleVol = cellText.replace(txt, '').replace(/\./g, '').trim()
      if (/^\d+$/.test(possibleVol) && possibleVol.length > 0) {
        const val = parseInt(possibleVol, 10)
        if (volume === '0' || (val > parseInt(volume, 10) && val < 10000000)) {
          volume = possibleVol
        }
      }
    }
    aiSuggestions.push({ keyword: txt, volume, cpc, competency })
  }
  return aiSuggestions
}

describe('DinoRank Extraction Stress Test - Fix Verified', () => {
  it('correctly identifies keyword vs volume in the same cell', () => {
    const html = `
      <table>
        <tr>
          <td>
            mi keyword seo
            70
            0,43 Media
          </td>
          <td>70</td>
          <td>0,43 Media</td>
        </tr>
      </table>
    `
    const dom = new JSDOM(html)
    const rows = Array.from(dom.window.document.querySelectorAll('tr'))
    const results = extractionLogic(rows as unknown as HTMLElement[])
    
    expect(results[0].keyword).toBe('mi keyword seo')
    expect(results[0].volume).toBe('70')
  })

  it('prefers link text for keyword if available', () => {
    const html = `
      <table>
        <tr>
          <td>
            <a href="#">keyword en link</a>
            <br>
            500
          </td>
          <td>500</td>
        </tr>
      </table>
    `
    const dom = new JSDOM(html)
    const rows = Array.from(dom.window.document.querySelectorAll('tr'))
    const results = extractionLogic(rows as unknown as HTMLElement[])
    
    expect(results[0].keyword).toBe('keyword en link')
    expect(results[0].volume).toBe('500')
  })
})
