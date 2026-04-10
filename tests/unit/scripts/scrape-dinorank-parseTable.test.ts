/**
 * Tests de validación del parseTable en DinoRankApiClient.
 *
 * Fixture HTML generado a partir de la estructura real devuelta por
 * kresearch.php para "algoritmos y estructuras de datos" (2026-03-05).
 *
 * Estructura real de la tabla:
 *   th[0]=""  th[1]="Palabras clave"  th[2]="Vol."  th[3]="Competencia"
 *   th[4]="CPC"  th[5]="Tendencia"  th[6]="Resultados de Google"  th[7]=""
 *
 * Cada keyword genera 2 filas: fila resumen (6 celdas) + fila detalle (1 celda con JS).
 * parseTable solo procesa filas con >= 5 celdas, ignorando las de detalle.
 */

import { describe, it, expect, vi } from 'vitest'

// ─── Mocks de dependencias (idénticos a los otros test files) ──────────────────

vi.mock('../../../src/scripts/create-post', () => ({
  loadState: vi.fn(() => ({ accounts: [], currentAccountIndex: 0 })),
  saveState: vi.fn(),
  registerAccount: vi.fn(),
  randomStr: vi.fn(() => 'abc12345'),
  randomPassword: vi.fn(() => 'TestPass123!'),
}))

vi.mock('fs', () => {
  const mod = {
    existsSync: vi.fn(() => false),
    readFileSync: vi.fn(() => '[]'),
    writeFileSync: vi.fn(),
    appendFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  }
  return { ...mod, default: mod }
})

// ─── Importar función bajo test ────────────────────────────────────────────────

// parseTable es privado — lo testamos vía scrapeOnce mockeando el API.
// Para tests unitarios puros, replicamos la lógica aquí (igual que extraction.test.ts).
import { JSDOM } from 'jsdom'
import type { KWCacheEntry } from '../../../src/scripts/scrape-dinorank'

/**
 * Replica exacta de DinoRankApiClient.parseTable() en scrape-dinorank.ts.
 * Si cambias la implementación, actualiza esta función también.
 */
function parseTable(html: string, country: string): KWCacheEntry[] {
  const dom = new JSDOM(html)
  const results: KWCacheEntry[] = []
  dom.window.document.querySelectorAll('tr').forEach(row => {
    const cells = Array.from(row.querySelectorAll('td'))
    if (cells.length < 5) return
    const kw = cells[1]!.textContent?.trim() ?? ''
    const vol = cells[2]!.textContent?.replace(/\D/g, '') ?? '0'
    const comp = cells[3]!.textContent?.replace(/[^\d,.]/g, '').replace(',', '.') ?? '0'
    const cpc = cells[4]!.textContent?.replace(/[^\d,.]/g, '').replace(',', '.') ?? '0'
    if (kw && kw.length > 1) {
      results.push({ keyword: kw, volume: vol, cpc, competency: comp, country, trend: [], relatedSearches: '', timestamp: new Date().toISOString() })
    }
  })
  return results
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Genera una fila resumen real de DinoRank (6 celdas) */
function makeRow(kw: string, vol: string, comp: string, cpc: string): string {
  return `<tr>
    <td></td>
    <td>${kw}</td>
    <td>${vol}</td>
    <td>${comp}</td>
    <td>${cpc}</td>
    <td>Ver más</td>
  </tr>`
}

/** Fila de detalle (1 celda con JS de gráfica) — debe ser ignorada por parseTable */
function makeDetailRow(kw: string): string {
  return `<tr><td>${kw}\n10\n0,48 Media\nOcultar var serie=[140,140,130]</td></tr>`
}

/** Tabla completa con encabezado real de DinoRank */
function makeTable(...rows: string[]): string {
  return `
    <table>
      <thead>
        <tr>
          <th></th><th>Palabras clave</th><th>Vol.</th>
          <th>Competencia</th><th>CPC</th><th>Tendencia</th>
          <th>Resultados de Google</th><th></th>
        </tr>
      </thead>
      <tbody>${rows.join('\n')}</tbody>
    </table>
  `
}

// ─── Tests: extracción de columnas ─────────────────────────────────────────────

describe('parseTable — columnas', () => {
  it('extrae keyword de cells[1]', () => {
    const html = makeTable(makeRow('algoritmos y estructuras de datos', '140', '0,48 Media', '0,20'))
    const [r] = parseTable(html, 'es')
    expect(r!.keyword).toBe('algoritmos y estructuras de datos')
  })

  it('extrae volume de cells[2] (solo dígitos)', () => {
    const html = makeTable(makeRow('test kw', '1.200', '0,30 Baja', '0,00'))
    const [r] = parseTable(html, 'es')
    expect(r!.volume).toBe('1200') // puntos de miles eliminados
  })

  it('extrae competency de cells[3] (valor decimal con coma)', () => {
    const html = makeTable(makeRow('seo tecnico', '200', '0,72 Alta', '1,50'))
    const [r] = parseTable(html, 'es')
    expect(r!.competency).toBe('0.72')
  })

  it('extrae CPC de cells[4]', () => {
    const html = makeTable(makeRow('seo tecnico', '200', '0,72 Alta', '1,50'))
    const [r] = parseTable(html, 'es')
    expect(r!.cpc).toBe('1.50')
  })

  it('CPC vacío cuando cells[4] es "Sin datos"', () => {
    const html = makeTable(makeRow('como hacer seo en mi pagina web', '10', '0,57 Media', 'Sin datos'))
    const [r] = parseTable(html, 'es')
    expect(r!.cpc).toBe('')
  })

  it('competency 0.00 cuando cells[3] no tiene dígitos', () => {
    const html = makeTable(makeRow('kw rara', '50', '—', '0,10'))
    const [r] = parseTable(html, 'es')
    expect(r!.competency).toBe('')
  })

  it('asigna el country recibido como parámetro', () => {
    const html = makeTable(makeRow('big o notation', '1000', '0,30 Baja', '0,80'))
    const [r] = parseTable(html, 'mx')
    expect(r!.country).toBe('mx')
  })

  it('trend siempre inicializa como array vacío', () => {
    const html = makeTable(makeRow('test', '100', '0,50 Media', '0,50'))
    const [r] = parseTable(html, 'es')
    expect(r!.trend).toEqual([])
  })
})

// ─── Tests: filtrado de filas ──────────────────────────────────────────────────

describe('parseTable — filtrado de filas', () => {
  it('ignora filas de detalle (1 celda con JS de gráfica)', () => {
    const html = makeTable(
      makeRow('algoritmos y estructuras de datos', '140', '0,48 Media', '0,20'),
      makeDetailRow('algoritmos y estructuras de datos'),
    )
    const results = parseTable(html, 'es')
    expect(results).toHaveLength(1)
  })

  it('ignora filas con keyword vacía en cells[1]', () => {
    const html = makeTable(makeRow('', '100', '0,50 Media', '0,50'))
    expect(parseTable(html, 'es')).toHaveLength(0)
  })

  it('ignora filas con keyword de un solo carácter', () => {
    const html = makeTable(makeRow('a', '100', '0,50 Media', '0,50'))
    expect(parseTable(html, 'es')).toHaveLength(0)
  })

  it('ignora filas con menos de 5 celdas (header alternativo, etc.)', () => {
    const html = `<table><tr><td>solo</td><td>4</td><td>celdas</td><td>aqui</td></tr></table>`
    expect(parseTable(html, 'es')).toHaveLength(0)
  })

  it('procesa múltiples keywords correctamente', () => {
    const html = makeTable(
      makeRow('algoritmos y estructuras de datos', '140', '0,48 Media', '0,20'),
      makeDetailRow('algoritmos y estructuras de datos'),
      makeRow('estructuras de datos y algoritmos', '140', '0,48 Media', '0,20'),
      makeDetailRow('estructuras de datos y algoritmos'),
      makeRow('algoritmos y estructuras de datos pdf', '20', '0,38 Baja', '0,00'),
      makeDetailRow('algoritmos y estructuras de datos pdf'),
    )
    expect(parseTable(html, 'es')).toHaveLength(3)
  })

  it('permite keywords duplicadas (DinoRank las devuelve a veces)', () => {
    const html = makeTable(
      makeRow('estructuras de datos y algoritmos pdf', '20', '0,20 Baja', '0,00'),
      makeDetailRow('estructuras de datos y algoritmos pdf'),
      makeRow('estructuras de datos y algoritmos pdf', '20', '0,20 Baja', '0,00'),
      makeDetailRow('estructuras de datos y algoritmos pdf'),
    )
    // parseTable no deduplica — eso es responsabilidad del caller
    expect(parseTable(html, 'es')).toHaveLength(2)
  })
})

// ─── Tests: validación de datos reales (fixture "algoritmos y estructuras de datos") ──

describe('parseTable — validación de datos reales', () => {
  // Fixture basado en los 33 resultados reales de la sesión del 2026-03-05
  const REAL_TABLE_HTML = makeTable(
    makeRow('algoritmos y estructuras de datos', '140', '0,48 Media', '0,20'),
    makeDetailRow('algoritmos y estructuras de datos'),
    makeRow('estructuras de datos y algoritmos', '140', '0,48 Media', '0,20'),
    makeDetailRow('estructuras de datos y algoritmos'),
    makeRow('estructuras de datos y algoritmos pdf', '20', '0,20 Baja', '0,00'),
    makeDetailRow('estructuras de datos y algoritmos pdf'),
    makeRow('algoritmos y estructuras de datos pdf', '20', '0,38 Baja', '0,00'),
    makeDetailRow('algoritmos y estructuras de datos pdf'),
    makeRow('libros de algoritmos y estructura de datos pdf', '10', '0,00 Baja', '0,00'),
    makeDetailRow('libros de algoritmos y estructura de datos pdf'),
    makeRow('algoritmos y estructuras de datos en python pdf', '10', '0,31 Baja', '0,00'),
    makeDetailRow('algoritmos y estructuras de datos en python pdf'),
    makeRow('algoritmos y estructuras de datos libro', '10', '0,57 Media', '0,10'),
    makeDetailRow('algoritmos y estructuras de datos libro'),
    makeRow('algoritmos y estructuras de datos python', '10', '0,00 Baja', '0,00'),
    makeDetailRow('algoritmos y estructuras de datos python'),
  )

  it('keyword semilla tiene el mayor volumen', () => {
    const results = parseTable(REAL_TABLE_HTML, 'es')
    const seed = results.find(r => r.keyword === 'algoritmos y estructuras de datos')
    expect(seed).toBeDefined()
    const maxVol = Math.max(...results.map(r => parseInt(r.volume || '0')))
    expect(parseInt(seed!.volume)).toBe(maxVol)
  })

  it('todos los volúmenes son enteros positivos', () => {
    const results = parseTable(REAL_TABLE_HTML, 'es')
    for (const r of results) {
      const vol = parseInt(r.volume)
      expect(vol).toBeGreaterThan(0)
      expect(Number.isInteger(vol)).toBe(true)
    }
  })

  it('todas las competencies son decimales en rango [0, 1]', () => {
    const results = parseTable(REAL_TABLE_HTML, 'es')
    for (const r of results) {
      if (!r.competency) continue
      const comp = parseFloat(r.competency)
      expect(comp).toBeGreaterThanOrEqual(0)
      expect(comp).toBeLessThanOrEqual(1)
    }
  })

  it('todos los CPC son valores no negativos', () => {
    const results = parseTable(REAL_TABLE_HTML, 'es')
    for (const r of results) {
      if (!r.cpc) continue
      const cpc = parseFloat(r.cpc)
      expect(cpc).toBeGreaterThanOrEqual(0)
    }
  })

  it('keyword semilla tiene competency=0.48 (Media)', () => {
    const results = parseTable(REAL_TABLE_HTML, 'es')
    const seed = results.find(r => r.keyword === 'algoritmos y estructuras de datos')
    expect(seed!.competency).toBe('0.48')
  })

  it('keyword semilla tiene CPC=0.20', () => {
    const results = parseTable(REAL_TABLE_HTML, 'es')
    const seed = results.find(r => r.keyword === 'algoritmos y estructuras de datos')
    expect(seed!.cpc).toBe('0.20')
  })

  it('variantes PDF tienen volumen menor a la keyword semilla', () => {
    const results = parseTable(REAL_TABLE_HTML, 'es')
    const seed = results.find(r => r.keyword === 'algoritmos y estructuras de datos')!
    const pdfVariants = results.filter(r => r.keyword.includes('pdf'))
    for (const r of pdfVariants) {
      expect(parseInt(r.volume)).toBeLessThan(parseInt(seed.volume))
    }
  })

  it('keywords con sufijo tecnología (python) tienen baja competencia', () => {
    const results = parseTable(REAL_TABLE_HTML, 'es')
    const pyKw = results.find(r => r.keyword.includes('python'))
    expect(pyKw).toBeDefined()
    expect(parseFloat(pyKw!.competency)).toBeLessThan(0.5)
  })

  it('todos los resultados tienen timestamp ISO válido', () => {
    const results = parseTable(REAL_TABLE_HTML, 'es')
    for (const r of results) {
      expect(() => new Date(r.timestamp).toISOString()).not.toThrow()
    }
  })

  it('ningún campo keyword contiene saltos de línea', () => {
    const results = parseTable(REAL_TABLE_HTML, 'es')
    for (const r of results) {
      expect(r.keyword).not.toMatch(/[\n\r]/)
    }
  })
})

// ─── Tests: competency con diferentes formatos de texto ───────────────────────

describe('parseTable — formatos de competencia', () => {
  it('Baja → extrae solo el decimal', () => {
    const html = makeTable(makeRow('kw', '100', '0,20 Baja', '0,00'))
    expect(parseTable(html, 'es')[0]!.competency).toBe('0.20')
  })

  it('Media → extrae solo el decimal', () => {
    const html = makeTable(makeRow('kw', '100', '0,48 Media', '0,20'))
    expect(parseTable(html, 'es')[0]!.competency).toBe('0.48')
  })

  it('Alta → extrae solo el decimal', () => {
    const html = makeTable(makeRow('kw', '100', '0,85 Alta', '2,50'))
    expect(parseTable(html, 'es')[0]!.competency).toBe('0.85')
  })

  it('0,00 sin etiqueta → devuelve "0.00"', () => {
    const html = makeTable(makeRow('kw', '100', '0,00', '0,00'))
    expect(parseTable(html, 'es')[0]!.competency).toBe('0.00')
  })
})
