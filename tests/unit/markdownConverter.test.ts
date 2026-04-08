import { describe, it, expect } from 'vitest'
import { convertMarkdownToLexical, convertLexicalToMarkdown } from '../../src/scripts/utils/markdownConverter'

describe('Markdown Converter', () => {
  describe('convertMarkdownToLexical', () => {
    it('should convert headings', () => {
      const markdown = '# Heading 1\n## Heading 2'
      const lexical = convertMarkdownToLexical(markdown)
      expect(lexical.root.children[0].type).toBe('heading')
      expect((lexical.root.children[0] as any).tag).toBe('h1')
      expect(lexical.root.children[1].type).toBe('heading')
      expect((lexical.root.children[1] as any).tag).toBe('h2')
    })

    it('should convert lists', () => {
      const markdown = '- Item 1\n- Item 2'
      const lexical = convertMarkdownToLexical(markdown)
      expect(lexical.root.children[0].type).toBe('list')
      expect((lexical.root.children[0] as any).listType).toBe('bullet')
      expect((lexical.root.children[0] as any).children).toHaveLength(2)
    })

    it('should convert code blocks', () => {
      const markdown = '```typescript\nconst x = 1\n```'
      const lexical = convertMarkdownToLexical(markdown)
      expect(lexical.root.children[0].type).toBe('block')
      expect((lexical.root.children[0] as any).fields.blockType).toBe('code-block')
      expect((lexical.root.children[0] as any).fields.code).toBe('const x = 1')
    })
  })

  describe('convertLexicalToMarkdown', () => {
    it('should convert Lexical back to Markdown', () => {
      const lexical: any = {
        root: {
          children: [
            {
              type: 'heading',
              tag: 'h1',
              children: [{ type: 'text', text: 'Title', format: 0 }]
            },
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: 'Hello ', format: 0 },
                { type: 'text', text: 'world', format: 1 } // Bold
              ]
            }
          ]
        }
      }
      const markdown = convertLexicalToMarkdown(lexical)
      expect(markdown).toBe('# Title\n\nHello **world**')
    })

    it('should handle code blocks', () => {
      const lexical: any = {
        root: {
          children: [
            {
              type: 'block',
              fields: {
                blockType: 'code-block',
                language: 'typescript',
                code: 'console.log("hi")'
              }
            }
          ]
        }
      }
      const markdown = convertLexicalToMarkdown(lexical)
      expect(markdown).toBe('```typescript\nconsole.log("hi")\n```')
    })
  })

  describe('Bidirectional Consistency', () => {
    it('should preserve complex content through both conversions', () => {
      const originalMd = '# Title\n\nThis is a **bold** and *italic* text.\n\n- Item 1\n- Item 2\n\n```typescript\nconsole.log(1);\n```'
      const lexical = convertMarkdownToLexical(originalMd)
      const convertedMd = convertLexicalToMarkdown(lexical)
      
      expect(convertedMd.replace(/\\s+/g, ' ')).toBe(originalMd.replace(/\\s+/g, ' '))
    })
  })
})
