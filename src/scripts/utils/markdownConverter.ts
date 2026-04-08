import { marked, Token, type Tokens } from 'marked'
import type { SerializedEditorState, SerializedLexicalNode, SerializedTextNode } from 'lexical'

// --- Extended Types for Lexical Nodes used in Payload ---

interface SerializedLinkNode extends SerializedLexicalNode {
  type: 'link'
  fields: {
    linkType: string
    newTab: boolean
    url: string
  }
  children: SerializedLexicalNode[]
}

interface SerializedHeadingNode extends SerializedLexicalNode {
  type: 'heading'
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  children: SerializedLexicalNode[]
}

interface SerializedListNode extends SerializedLexicalNode {
  type: 'list'
  listType: 'number' | 'bullet'
  tag: 'ol' | 'ul'
  start: number
}

interface SerializedBlockNode extends SerializedLexicalNode {
  type: 'block'
  fields: Record<string, unknown>
}

// --- Markdown to Lexical ---

export const convertMarkdownToLexical = (
  markdown: string,
  primaryKeyword?: string,
  idioma: 'en' | 'es' = 'es'
): SerializedEditorState => {
  const tokens = marked.lexer(markdown)
  const rootChildren: SerializedLexicalNode[] = []

  const parseInline = (appendedTokens: Token[]): SerializedLexicalNode[] => {
    const nodes: SerializedLexicalNode[] = []
    appendedTokens.forEach((token) => {
      if (token.type === 'text') {
        const textToken = token as Extract<Token, { tokens?: Token[] }>
        if (textToken.tokens) {
          nodes.push(...parseInline(textToken.tokens))
        } else {
          nodes.push({
            type: 'text',
            text: token.text,
            format: 0,
            detail: 0,
            mode: 'normal',
            style: '',
            version: 1,
          } as SerializedTextNode)
        }
      } else if (token.type === 'strong') {
        const children = parseInline(token.tokens || [])
        children.forEach((child) => {
          if (child.type === 'text') {
            const textChild = child as SerializedTextNode
            textChild.format = (textChild.format || 0) | 1
          }
        })
        nodes.push(...children)
      } else if (token.type === 'em') {
        const children = parseInline(token.tokens || [])
        children.forEach((child) => {
          if (child.type === 'text') {
            const textChild = child as SerializedTextNode
            textChild.format = (textChild.format || 0) | 2
          }
        })
        nodes.push(...children)
      } else if (token.type === 'codespan') {
        nodes.push({
          type: 'text',
          text: token.text,
          format: 16,
          detail: 0,
          mode: 'normal',
          style: '',
          version: 1,
        } as SerializedTextNode)
      } else if (token.type === 'link') {
        nodes.push({
          type: 'link',
          format: '',
          indent: 0,
          version: 1,
          fields: {
            linkType: 'custom',
            newTab: false,
            url: token.href,
          },
          children: parseInline(token.tokens || []),
          direction: 'ltr',
        } as unknown as SerializedLinkNode)
      }
    })
    return nodes
  }

  let faqMode = false
  let currentFaq: { question: string; answer: string } | null = null
  const faqs: { question: string; answer: string }[] = []

  const getFaqTitle = () => {
    if (!primaryKeyword) return idioma === 'es' ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'
    return idioma === 'es' 
      ? `Preguntas frecuentes sobre ${primaryKeyword}` 
      : `Frequently asked questions about ${primaryKeyword}`
  }

  tokens.forEach((token) => {
    // FAQ Detection Logic: Matches headers containing "FAQ" or "Preguntas Frecuentes"
    const isFaqHeader = token.type === 'heading' && 
      /(faq|preguntas frecuentes)/i.test(token.text)

    if (isFaqHeader) {
      faqMode = true
      return // Skip the heading token itself
    }

    if (faqMode) {
      if (token.type === 'heading' && token.depth <= 2) {
        // End FAQ mode if another H2 or higher heading is found
        if (faqs.length > 0 || currentFaq) {
          if (currentFaq) faqs.push(currentFaq)
          rootChildren.push({
            type: 'block',
            format: '',
            indent: 0,
            version: 2,
            fields: {
              id: new Date().getTime().toString() + Math.random().toString(36).substring(7),
              blockType: 'faq',
              title: getFaqTitle(),
              faqs: faqs.map(faqItem => ({
                question: faqItem.question,
                answer: convertMarkdownToLexical(faqItem.answer, primaryKeyword, idioma),
              })),
            },
          } as unknown as SerializedBlockNode)
          faqs.length = 0
          currentFaq = null
        }
        faqMode = false
      } else if (token.type === 'heading' && token.depth === 3) {
        // Question found as H3
        if (currentFaq) faqs.push(currentFaq)
        currentFaq = { question: token.text.trim(), answer: '' }
        return
      } else if (currentFaq) {
        // Add to the current FAQ answer (handle paragraphs, etc.)
        currentFaq.answer += (currentFaq.answer ? '\n\n' : '') + token.raw
        return
      }
    }

    if (token.type === 'heading') {
      rootChildren.push({
        type: 'heading',
        tag: `h${token.depth}` as SerializedHeadingNode['tag'],
        format: '',
        indent: 0,
        version: 1,
        children: parseInline(token.tokens || []),
        direction: 'ltr',
      } as unknown as SerializedHeadingNode)
    } else if (token.type === 'paragraph') {
      rootChildren.push({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children: parseInline(token.tokens || []),
        direction: 'ltr',
      } as SerializedLexicalNode)
    } else if (token.type === 'list') {
      const listNode = {
        type: 'list',
        listType: token.ordered ? 'number' : 'bullet',
        start: token.ordered && token.start ? token.start : 1,
        tag: token.ordered ? 'ol' : 'ul',
        format: '',
        indent: 0,
        version: 1,
        children: token.items.map((item: Tokens.ListItem) => ({
          type: 'listitem',
          format: '',
          indent: 0,
          version: 1,
          value: 1,
          children: parseInline(item.tokens || []),
          direction: 'ltr',
        })),
        direction: 'ltr',
      }
      rootChildren.push(listNode as unknown as SerializedListNode)
    } else if (token.type === 'blockquote') {
      rootChildren.push({
        type: 'quote',
        format: '',
        indent: 0,
        version: 1,
        children: parseInline(token.tokens || []),
        direction: 'ltr',
      } as SerializedLexicalNode)
    } else if (token.type === 'table') {
      const headerRow = {
        type: 'tablerow',
        format: '',
        indent: 0,
        version: 1,
        children: token.header.map((headerCell: Tokens.TableCell) => ({
          type: 'tablecell',
          format: '',
          indent: 0,
          version: 1,
          header: true,
          children: [
            {
              type: 'paragraph',
              format: '',
              indent: 0,
              version: 1,
              children: parseInline(headerCell.tokens || []),
              direction: 'ltr',
            },
          ],
          direction: 'ltr',
        })),
        direction: 'ltr',
      }

      const bodyRows = token.rows.map((row: Tokens.TableCell[]) => ({
        type: 'tablerow',
        format: '',
        indent: 0,
        version: 1,
        children: row.map((cell: Tokens.TableCell) => ({
          type: 'tablecell',
          format: '',
          indent: 0,
          version: 1,
          header: false,
          children: [
            {
              type: 'paragraph',
              format: '',
              indent: 0,
              version: 1,
              children: parseInline(cell.tokens || []),
              direction: 'ltr',
            },
          ],
          direction: 'ltr',
        })),
        direction: 'ltr',
      }))

      rootChildren.push({
        type: 'table',
        format: '',
        indent: 0,
        version: 1,
        children: [headerRow, ...bodyRows],
        direction: 'ltr',
      } as unknown as SerializedLexicalNode)
    } else if (token.type === 'code') {
      const langMap: Record<string, string> = {
        ts: 'typescript',
        tsx: 'typescript',
        js: 'javascript',
        jsx: 'javascript',
        css: 'css',
      }
      const mappedLang = langMap[token.lang || ''] || 'typescript'
      rootChildren.push({
        type: 'block',
        format: '',
        indent: 0,
        version: 2,
        fields: {
          id: new Date().getTime().toString() + Math.random().toString(36).substring(7),
          blockType: 'code-block',
          code: token.text,
          language: mappedLang,
        },
      } as unknown as SerializedBlockNode)
    }
  })

  // Final push for FAQ if it was at the end of the file
  if (faqMode && (faqs.length > 0 || currentFaq)) {
    if (currentFaq) faqs.push(currentFaq)
    rootChildren.push({
      type: 'block',
      format: '',
      indent: 0,
      version: 2,
      fields: {
        id: new Date().getTime().toString() + Math.random().toString(36).substring(7),
        blockType: 'faq',
        title: getFaqTitle(),
        faqs: faqs.map(faqItem => ({
          question: faqItem.question,
          answer: convertMarkdownToLexical(faqItem.answer, primaryKeyword, idioma),
        })),
      },
    } as unknown as SerializedBlockNode)
  }

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: rootChildren,
      direction: 'ltr',
    },
  }
}

// --- Lexical to Markdown ---

export const convertLexicalToMarkdown = (editorState: SerializedEditorState): string => {
  if (!editorState?.root?.children) return ''

  const serializeNode = (node: SerializedLexicalNode): string => {
    if (node.type === 'text') {
      const textNode = node as SerializedTextNode
      let text = textNode.text
      if (textNode.format & 1) text = `**${text}**`
      if (textNode.format & 2) text = `*${text}*`
      if (textNode.format & 16) text = `\`${text}\``
      return text
    }

    if (node.type === 'link') {
      const linkNode = node as SerializedLinkNode
      return `[${linkNode.children.map(serializeNode).join('')}](${linkNode.fields.url})`
    }

    if (node.type === 'heading') {
      const headingNode = node as SerializedHeadingNode
      const level = headingNode.tag.replace('h', '')
      return `${'#'.repeat(parseInt(level, 10))} ${headingNode.children.map(serializeNode).join('')}\n\n`
    }

    if (node.type === 'paragraph') {
      const paragraphNode = node as SerializedLexicalNode & { children: SerializedLexicalNode[] }
      return `${paragraphNode.children.map(serializeNode).join('')}\n\n`
    }

    if (node.type === 'list') {
      type ListItemNode = SerializedLexicalNode & { children: SerializedLexicalNode[] }
      const listNode = node as SerializedListNode & { children: ListItemNode[] }
      return listNode.children.map((listItem, index) => {
        const prefix = listNode.listType === 'number' ? `${index + 1}. ` : '- '
        return `${prefix}${listItem.children.map(serializeNode).join('')}\n`
      }).join('') + '\n'
    }

    if (node.type === 'quote') {
      const quoteNode = node as SerializedLexicalNode & { children: SerializedLexicalNode[] }
      return `> ${quoteNode.children.map(serializeNode).join('')}\n\n`
    }

    if (node.type === 'table') {
      type TableCellNode = SerializedLexicalNode & { children: SerializedLexicalNode[] }
      type TableRowNode = SerializedLexicalNode & { children: TableCellNode[] }
      type TableNode = SerializedLexicalNode & { children: TableRowNode[] }
      const tableNode = node as TableNode
      const rows = tableNode.children.map((row) => {
        const cells = row.children.map((cell) => {
          // Extract text from cell (which usually contains a paragraph)
          return cell.children.map(serializeNode).join('').trim()
        })
        return `| ${cells.join(' | ')} |`
      })

      if (rows.length > 0) {
        const header = rows[0]
        const body = rows.slice(1)
        const cellCount = tableNode.children[0].children.length
        const separator = `| ${Array(cellCount).fill('---').join(' | ')} |`
        return `\n${header}\n${separator}\n${body.join('\n')}\n\n`
      }
      return ''
    }

    if (node.type === 'block') {
      interface CodeBlockFields { blockType: string; language?: string; code?: string }
      interface FaqItem { question: string; answer: SerializedEditorState | string }
      interface FaqBlockFields { blockType: string; title?: string; faqs?: FaqItem[] }
      const blockNode = node as SerializedBlockNode
      const blockType = blockNode.fields.blockType as string | undefined

      if (blockType === 'code-block') {
        const fields = blockNode.fields as unknown as CodeBlockFields
        return `\`\`\`${fields.language}\n${fields.code}\n\`\`\`\n\n`
      }

      if (blockType === 'faq') {
        const fields = blockNode.fields as unknown as FaqBlockFields
        let md = `## ${fields.title || 'Preguntas Frecuentes'}\n\n`
        fields.faqs?.forEach((faq) => {
          const answerText = typeof faq.answer === 'string'
            ? faq.answer
            : (faq.answer?.root?.children?.map(serializeNode).join('') || '')
          md += `### ${faq.question}\n\n${answerText.trim()}\n\n`
        })
        return md
      }

      return `\n<!-- Block: ${blockType} -->\n\n`
    }

    return ''
  }

  return editorState.root.children.map(serializeNode).join('').trim()
}
