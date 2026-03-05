/**
 * Tests unitarios para src/scripts/scrape-dinorank.ts
 *
 * Cubre funciones exportadas:
 *  - isCacheValid: lógica de TTL de 30 días
 *  - loadCache / saveCache: lectura/escritura con manejo de errores de fs
 *  - updateMarkdownTable: actualización e inserción de filas en tabla Markdown
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock create-post para evitar cargar su código (que también importa fs y playwright)
vi.mock('../../../src/scripts/create-post', () => ({
  loadState: vi.fn(() => ({ accounts: [], currentAccountIndex: 0 })),
  saveState: vi.fn(),
  registerAccount: vi.fn(),
  randomStr: vi.fn(() => 'abc12345'),
  randomPassword: vi.fn(() => 'TestPass123!'),
}))

// Mock fs con factory síncrona para garantizar que vi.fn() está disponible
// antes de que scrape-dinorank.ts importe sus bindings de 'fs'
vi.mock('fs', () => {
  const mod = {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    appendFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  }
  // Incluir default para interop CJS/ESM
  return { ...mod, default: mod }
})

import { existsSync, readFileSync, writeFileSync } from 'fs'
import {
  isCacheValid,
  loadCache,
  saveCache,
  updateMarkdownTable,
  type KWCacheEntry,
  type KWCache,
} from '../../../src/scripts/scrape-dinorank'

const mockExistsSync = vi.mocked(existsSync)
const mockReadFileSync = vi.mocked(readFileSync)
const mockWriteFileSync = vi.mocked(writeFileSync)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<KWCacheEntry> = {}): KWCacheEntry {
  return {
    keyword: 'test keyword',
    country: 'es',
    volume: '1000',
    competency: '0,45',
    cpc: '1.20',
    trend: [100, 120, 110],
    relatedSearches: 'test related',
    timestamp: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeResult(volume: string, competency: string, related: string = ''): KWCacheEntry {
  return {
    keyword: 'test',
    country: 'es',
    trend: [],
    timestamp: '2025-01-01T00:00:00.000Z',
    volume,
    competency,
    cpc: '0,00 €',
    relatedSearches: related,
  }
}

/** Tabla base reutilizada en los tests de updateMarkdownTable */
const BASE_TABLE = [
  '| Keyword | URL | Status | Country | Language | Volume | Difficulty | CPC | Source | Related Searches |',
  '|---|---|---|---|---|---|---|---|---|---|',
  '| mi palabra clave | /seo/mi-post | | mx | es | | | | | |',
  '| technical seo | /seo/tech | | es | en | 10 | 50 | | DinoRank | seo tech |',
].join('\n')

// ─── isCacheValid ─────────────────────────────────────────────────────────────

describe('isCacheValid', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('timestamp de hoy → válido', () => {
    const now = new Date('2025-06-01T00:00:00.000Z')
    vi.setSystemTime(now)
    expect(isCacheValid(now.toISOString())).toBe(true)
  })

  it('timestamp de hace 15 días → válido', () => {
    vi.setSystemTime(new Date('2025-06-16T00:00:00.000Z'))
    expect(isCacheValid('2025-06-01T00:00:00.000Z')).toBe(true)
  })

  it('timestamp de hace exactamente 30 días → válido (límite inclusivo)', () => {
    // Junio tiene 30 días: del 1 de junio al 1 de julio = exactamente 30 días
    vi.setSystemTime(new Date('2025-07-01T00:00:00.000Z'))
    expect(isCacheValid('2025-06-01T00:00:00.000Z')).toBe(true)
  })

  it('timestamp de hace 31 días → expirado', () => {
    vi.setSystemTime(new Date('2025-07-02T00:00:00.000Z'))
    expect(isCacheValid('2025-06-01T00:00:00.000Z')).toBe(false)
  })

  it('timestamp de hace 1 año → expirado', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    expect(isCacheValid('2025-01-01T00:00:00.000Z')).toBe(false)
  })

  it('timestamp inválido → expirado (NaN no supera el límite)', () => {
    vi.setSystemTime(new Date('2025-06-01T00:00:00.000Z'))
    expect(isCacheValid('not-a-valid-date')).toBe(false)
  })
})

// ─── loadCache ────────────────────────────────────────────────────────────────

describe('loadCache', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('devuelve {} cuando el archivo de caché no existe', () => {
    mockExistsSync.mockReturnValue(false)
    expect(loadCache()).toEqual({})
  })

  it('parsea y devuelve un archivo JSON válido', () => {
    const entry = makeEntry({ keyword: 'seo', country: 'es' })
    const cache: KWCache = { 'seo_es': entry }
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify(cache) as never)
    expect(loadCache()).toEqual(cache)
  })

  it('devuelve {} cuando el JSON está malformado', () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue('{invalid json' as never)
    expect(loadCache()).toEqual({})
  })

  it('devuelve {} cuando el archivo está vacío', () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue('' as never)
    expect(loadCache()).toEqual({})
  })
})

// ─── saveCache ────────────────────────────────────────────────────────────────

describe('saveCache', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('llama a writeFileSync exactamente una vez con el JSON correcto', () => {
    const cache: KWCache = { 'seo_es': makeEntry({ keyword: 'seo', country: 'es' }) }
    saveCache(cache)
    expect(mockWriteFileSync).toHaveBeenCalledOnce()
    const [, written] = mockWriteFileSync.mock.calls[0]!
    expect(JSON.parse(written as string)).toEqual(cache)
  })

  it('roundtrip: loadCache devuelve exactamente lo que se guardó con saveCache', () => {
    const cache: KWCache = { 'kw1_mx': makeEntry({ keyword: 'kw1', country: 'mx' }) }
    let stored = ''
    mockWriteFileSync.mockImplementation((_path: unknown, data: unknown) => {
      stored = data as string
    })
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockImplementation(() => stored as never)

    saveCache(cache)
    expect(loadCache()).toEqual(cache)
  })
})

// ─── updateMarkdownTable ──────────────────────────────────────────────────────

describe('updateMarkdownTable', () => {
  it('actualiza volume, difficulty y related en una keyword existente', () => {
    const updated = updateMarkdownTable(
      BASE_TABLE,
      'mi palabra clave',
      makeResult('100', '0,45', 'otra; mas palabras'),
      'es',
      'es',
    )
    expect(updated).toContain(' 100 ')
    expect(updated).toContain(' 45 ')
    expect(updated).toContain(' otra; mas palabras ')
    expect(updated).toContain(' DinoRank ')
  })

  it('no sobrescribe Country ni Language cuando ya tienen valor en la tabla', () => {
    const updated = updateMarkdownTable(
      BASE_TABLE,
      'technical seo',
      makeResult('250', '0,72'),
      'mx', // arg: mx, pero la tabla ya tiene es
      'es', // arg: es, pero la tabla ya tiene en
    )
    const line = updated.split('\n').find((l) => l.includes('technical seo'))!
    // Country y Language originales se preservan
    expect(line).toMatch(/\|es\|/)
    expect(line).toMatch(/\|en\|/)
    expect(line).toContain(' 250 ')
    expect(line).toContain(' 72 ')
  })

  it('añade una nueva keyword como última fila si no existía en la tabla', () => {
    const updated = updateMarkdownTable(
      BASE_TABLE,
      'nueva keyword',
      makeResult('50', '0,10', 'algo nuevo'),
      'ar',
      'es',
    )
    const lines = updated.trim().split('\n')
    const lastLine = lines[lines.length - 1]!
    expect(lastLine).toContain('nueva keyword')
    expect(lastLine).toContain(' ar ')
    expect(lastLine).toContain(' es ')
    expect(lastLine).toContain(' 50 ')
    expect(lastLine).toContain(' 10 ')
    expect(lastLine).toContain(' algo nuevo ')
  })

  it('añade padding (espacio) a las celdas al actualizar', () => {
    const table = [
      '| Keyword | Volume | Difficulty | Country | Language | Related Searches | Source |',
      '|---|---|---|---|---|---|---|',
      '| test padding | 0 | 0 | | | | |',
    ].join('\n')
    const updated = updateMarkdownTable(
      table,
      'test padding',
      makeResult('150', '0,33', 'test related'),
      'co',
      'es',
    )
    const line = updated.split('\n').find((l) => l.includes('test padding'))!
    expect(line).toContain('| 150 ')
    expect(line).toContain('| 33 ')
    expect(line).toContain('| co ')
    expect(line).toContain('| es ')
    expect(line).toContain('| test related ')
    expect(line).toContain('| DinoRank ')
  })

  it('convierte competency con coma decimal (0,45) a porcentaje entero (45)', () => {
    const updated = updateMarkdownTable(BASE_TABLE, 'mi palabra clave', makeResult('500', '0,45'))
    const line = updated.split('\n').find((l) => l.includes('mi palabra clave'))!
    expect(line).toContain(' 45 ')
    expect(line).not.toContain('0,45')
  })

  it('convierte competency con punto decimal (0.72) a porcentaje entero (72)', () => {
    const updated = updateMarkdownTable(BASE_TABLE, 'mi palabra clave', makeResult('500', '0.72'))
    const line = updated.split('\n').find((l) => l.includes('mi palabra clave'))!
    expect(line).toContain(' 72 ')
  })

  it('serializa el array trend como string de números separados por comas', () => {
    const table = [
      '| Keyword | Volume | Difficulty | Trend | Source |',
      '|---|---|---|---|---|',
      '| kw con trend | | | | |',
    ].join('\n')
    const result: KWCacheEntry = { ...makeResult('300', '0,50'), trend: [100, 200, 150] }
    const updated = updateMarkdownTable(table, 'kw con trend', result)
    const line = updated.split('\n').find((l) => l.includes('kw con trend'))!
    expect(line).toContain(' 100,200,150 ')
  })

  it('trend vacío deja la celda Trend sin datos numéricos', () => {
    const table = [
      '| Keyword | Volume | Trend | Source |',
      '|---|---|---|---|',
      '| kw sin trend | | | |',
    ].join('\n')
    const result: KWCacheEntry = { ...makeResult('300', '0,50'), trend: [] }
    const updated = updateMarkdownTable(table, 'kw sin trend', result)
    const line = updated.split('\n').find((l) => l.includes('kw sin trend'))!
    // La celda de trend no debe contener secuencias del tipo "número,número"
    expect(line).not.toMatch(/\|\s*\d+,\d+\s*\|/)
  })

  it('elimina caracteres no numéricos del campo volume', () => {
    const updated = updateMarkdownTable(
      BASE_TABLE,
      'mi palabra clave',
      makeResult('1.200 búsquedas', '0,30'),
    )
    const line = updated.split('\n').find((l) => l.includes('mi palabra clave'))!
    expect(line).toContain(' 1200 ')
    expect(line).not.toContain('búsquedas')
  })

  it('devuelve el contenido sin cambios cuando no hay ninguna tabla Markdown', () => {
    const noTable = 'Este es texto plano sin tabla'
    expect(updateMarkdownTable(noTable, 'keyword', makeResult('100', '0,5'))).toBe(noTable)
  })

  it('devuelve el contenido sin cambios cuando la tabla no tiene columna Keyword', () => {
    const table = [
      '| Title | Volume | Difficulty |',
      '|---|---|---|',
      '| algo | 100 | 50 |',
    ].join('\n')
    expect(updateMarkdownTable(table, 'algo', makeResult('100', '0,5'))).toBe(table)
  })

  it('la comparación de keyword es case-insensitive', () => {
    const updated = updateMarkdownTable(
      BASE_TABLE,
      'TECHNICAL SEO', // mayúsculas, la tabla tiene "technical seo"
      makeResult('999', '0,80'),
    )
    const line = updated.split('\n').find((l) => l.includes('technical seo'))!
    expect(line).toContain(' 999 ')
    expect(line).toContain(' 80 ')
  })

  it('solo actualiza la fila que coincide, dejando las demás sin cambios', () => {
    const updated = updateMarkdownTable(BASE_TABLE, 'mi palabra clave', makeResult('999', '0,99'))
    const techLine = updated.split('\n').find((l) => l.includes('technical seo'))!
    // La fila de "technical seo" no debe haber sido tocada
    expect(techLine).toContain('10') // volumen original
    expect(techLine).toContain('50') // difficulty original
    expect(techLine).toContain('DinoRank') // source original
  })
})
