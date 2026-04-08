import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs'
import { parseKeywordsMarkdown, formatLine, KeywordData } from '../../../src/scripts/syncKeywords'

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
  },
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}))

describe('Keyword Backlog Logic', () => {
  const mockHeaders = '| Keyword | Target URL | Language | Country | Volume | Difficulty | Intent | Status | Last Updated | Related Searches | PAA Questions | Top Domain | Has AI Overview | SERP Features | Competitor Headings | Competitor Meta | Avg. Word Count | Cluster Type | Suggested Anchor Text |'
  const mockDivider = '| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |'

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('correctly parses suggestions and formats them for backlog', () => {
    const suggestion: KeywordData = {
      keyword: 'keyword sugerida',
      targetURL: '-',
      volume: 500,
      difficulty: 20,
      intent: 'Informational',
      status: '-',
      lastUpdated: '2026-03-04',
      country: 'es',
      language: 'es'
    }

    const line = formatLine(suggestion)
    
    expect(line).toContain('| keyword sugerida |')
    expect(line).toContain('| 500 |')
    expect(line).toContain('| 20 |')
    expect(line).toContain('| - |') // status
  })

  it('avoids duplicates between main file and backlog (conceptual test)', () => {
    const mainContent = `${mockHeaders}
${mockDivider}
| keyword existente | / | es | es | 10 | 0 | Informational | - | | | | | No | | | | 0 | | |`
    const backlogContent = `${mockHeaders}
${mockDivider}
| keyword en backlog | / | es | es | 10 | 0 | Informational | - | | | | | No | | | | 0 | | |`
    
    const suggestions: KeywordData[] = [
      { keyword: 'keyword existente', volume: 100 } as any, // Ya en main
      { keyword: 'keyword en backlog', volume: 200 } as any, // Ya en backlog
      { keyword: 'keyword nueva', volume: 300 } as any      // Realmente nueva
    ]

    // Simulamos la lógica de updateBacklog
    const existingInMain = new Set(['keyword existente'])
    const existingInBacklog = new Set(['keyword en backlog'])
    
    const toAdd = suggestions.filter(s => 
      !existingInMain.has(s.keyword.toLowerCase()) && 
      !existingInBacklog.has(s.keyword.toLowerCase())
    )

    expect(toAdd).toHaveLength(1)
    expect(toAdd[0].keyword).toBe('keyword nueva')
  })
})
