import { describe, expect, it } from 'vitest'
import { updateMarkdownTable } from '../../../src/scripts/scrape-dinorank'

describe('scrape-dinorank: updateMarkdownTable', () => {
  const initialTable = `
| Keyword | URL | Status | Country | Language | Volume | Difficulty | CPC | Source | Related Searches |
|---|---|---|---|---|---|---|---|---|---|
| mi palabra clave | /seo/mi-post | | mx | es | | | | | |
| technical seo | /seo/tech | | es | en | 10 | 50 | | DinoRank | seo tech |
`

  const makeResult = (volume: string, competency: string, related: string = '') => ({
    keyword: 'test',
    country: 'es',
    trend: [],
    timestamp: new Date().toISOString(),
    volume,
    competency,
    cpc: '0,00 €',
    relatedSearches: related,
  })

  it('debería actualizar una palabra clave existente sin country y lang vacíos si se le pasan', () => {
    const updated = updateMarkdownTable(
      initialTable,
      'mi palabra clave',
      makeResult('100', '0,45', 'otra palabra; mas palabras'),
      'es',
      'es',
    )

    // Verifica que reemplace el volumen, la dificultad, la búsqueda, pero NO sobrescriba el country/language (ya tenían mx/es).
    expect(updated).toContain('|mx|')
    expect(updated).toContain('|es|')
    expect(updated).toContain(' 100 ')
    expect(updated).toContain(' 45 ')
    expect(updated).toContain(' otra palabra; mas palabras ')
    expect(updated).toContain(' DinoRank ')
  })

  it('debería no sobrescribir Country y Lang si ya existen', () => {
    const updated = updateMarkdownTable(
      initialTable,
      'technical seo',
      makeResult('250', '0,72', 'tech seo'),
      'mx', // Se le pasa mx, pero la table ya tiene es
      'es', // Se le pasa es, pero la table ya tiene en
    )
    const line = updated.split('\n').find((l) => l.includes('technical seo'))
    expect(line).toBeDefined()
    expect(line).toMatch(/\|es\|/)
    expect(line).toMatch(/\|en\|/)
    expect(line).toMatch(/\| 250 /)
    expect(line).toMatch(/\| 72 /)
  })

  it('debería añadir una nueva palabra clave al final de la tabla si no existe', () => {
    const updated = updateMarkdownTable(
      initialTable,
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

  it('debería añadir padding a las celdas', () => {
    const initialWithoutPadding = `
| Keyword | Volume | Difficulty | Country | Language | Related Searches | Source |
|---|---|---|---|---|---|---|
| test padding | 0 | 0 | | | | |
`
    const updated = updateMarkdownTable(
      initialWithoutPadding,
      'test padding',
      makeResult('150', '0,33', 'test related'),
      'co',
      'es',
    )
    const line = updated.split('\n').find((l) => l.includes('test padding'))
    expect(line).toBeDefined()
    expect(line).toContain('| 150 ')
    expect(line).toContain('| 33 ')
    expect(line).toContain('| co ')
    expect(line).toContain('| es ')
    expect(line).toContain('| test related ')
    expect(line).toContain('| DinoRank ')
  })
})
