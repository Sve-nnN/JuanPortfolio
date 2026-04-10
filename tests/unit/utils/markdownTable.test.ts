import { describe, it, expect } from 'vitest'
import {
  parseKeywordsMarkdown,
  formatLine,
  updateKeywordInTable,
  OFFICIAL_HEADERS,
} from '../../../src/scripts/utils/markdownTable'
import { KeywordData } from '../seo/keyword-utils'

describe('markdownTable utilities', () => {
  const sampleMd = `
# Keywords

| Keyword | Volume | Difficulty | Status |
| :--- | :--- | :--- | :--- |
| seo tecnico | 100 | 20 | - |
| nextjs payload | 50 | 10 | LIVE |
`

  it('should parse keywords and headers correctly', () => {
    const { keywords, headers } = parseKeywordsMarkdown(sampleMd)
    expect(headers).toEqual(['Keyword', 'Volume', 'Difficulty', 'Status'])
    expect(keywords).toHaveLength(2)
    expect(keywords[0]!.keyword).toBe('seo tecnico')
    expect(keywords[0]!.volume).toBe(100)
    expect(keywords[1]!.keyword).toBe('nextjs payload')
    expect(keywords[1]!.status).toBe('LIVE')
  })

  it('should format a line correctly with spaces', () => {
    const data: KeywordData = {
      keyword: 'test kw',
      volume: 10,
      difficulty: 5,
      status: 'DRAFT',
      targetURL: '',
      intent: '',
    }
    const headers = ['Keyword', 'Volume', 'Status']
    const line = formatLine(data, headers)
    expect(line).toBe('| test kw | 10 | DRAFT |')
  })

  it('should update an existing keyword in the table', () => {
    const data: KeywordData = {
      keyword: 'seo tecnico',
      volume: 200,
      difficulty: 25,
      status: 'UPDATED',
      targetURL: '',
      intent: '',
    }
    const result = updateKeywordInTable(sampleMd, data)
    expect(result).toContain('| seo tecnico | 200 | 25 | UPDATED |')
    expect(result).toContain('| nextjs payload | 50 | 10 | LIVE |')
  })

  it('should add a new keyword to the table', () => {
    const data: KeywordData = {
      keyword: 'new keyword',
      volume: 10,
      difficulty: 5,
      status: '-',
      targetURL: '',
      intent: '',
    }
    const result = updateKeywordInTable(sampleMd, data)
    expect(result).toContain('| new keyword | 10 | 5 | - |')
    expect(result.split('\n').filter(l => l.trim().startsWith('|'))).toHaveLength(5) // header + divider + 3 rows
  })

  it('should handle special characters in keywords', () => {
    const data: KeywordData = {
      keyword: 'keyword with | pipe',
      volume: 0,
      difficulty: 0,
      status: '-',
      targetURL: '',
      intent: '',
    }
    const headers = ['Keyword', 'Status']
    const line = formatLine(data, headers)
    expect(line).toBe('| keyword with \\| pipe | - |')
    
    const mdWithPipe = `# Table\n\n| Keyword | Status |\n| :--- | :--- |\n${line}\n`
    const { keywords } = parseKeywordsMarkdown(mdWithPipe)
    expect(keywords[0]!.keyword).toBe('keyword with | pipe')
  })
})
