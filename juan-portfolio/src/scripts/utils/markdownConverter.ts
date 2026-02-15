import { marked, Token } from 'marked'
import type { SerializedEditorState, SerializedLexicalNode, SerializedTextNode } from 'lexical'

// --- Extended Types for Lexical Nodes used in Payload ---

interface SerializedLinkNode extends SerializedLexicalNode {
  type: 'link'
  fields: {
    linkType: string
    newTab: boolean
    url: string
  }
}

interface SerializedHeadingNode extends SerializedLexicalNode {
  type: 'heading'
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

interface SerializedListNode extends SerializedLexicalNode {
  type: 'list'
  listType: 'number' | 'bullet'
  tag: 'ol' | 'ul'
  start: number
}

interface SerializedBlockNode extends SerializedLexicalNode {
  type: 'block'
  fields: Record<string, any>
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
              faqs: [...faqs],
            },
          } as unknown as SerializedBlockNode)
          faqs.length = 0
          currentFaq = null
        }
        faqMode = false
      } else if (token.type === 'paragraph') {
        const text = token.text.trim()
        // Simple heuristic: Question is bold, answer is plain text below it
        if (text.startsWith('**') && text.endsWith('**')) {
          if (currentFaq) faqs.push(currentFaq)
          currentFaq = { question: text.replace(/\*\*/g, ''), answer: '' }
        } else if (currentFaq) {
          currentFaq.answer += (currentFaq.answer ? '\n' : '') + text
        }
        return // Skip standard paragraph handling while in FAQ mode
      } else if (token.type === 'heading' && token.depth === 3) {
        // Question found as H3
        if (currentFaq) faqs.push(currentFaq)
        currentFaq = { question: token.text, answer: '' }
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
        children: token.items.map((item) => ({
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
        faqs: [...faqs],
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

  const serializeNode = (node: any): string => {
    if (node.type === 'text') {
      let text = node.text
      if (node.format & 1) text = `**${text}**`
      if (node.format & 2) text = `*${text}*`
      if (node.format & 16) text = `\`${text}\``
      return text
    }

    if (node.type === 'link') {
      return `[${node.children.map(serializeNode).join('')}](${node.fields.url})`
    }

    if (node.type === 'heading') {
      const level = (node as SerializedHeadingNode).tag.replace('h', '')
      return `${'#'.repeat(parseInt(level, 10))} ${node.children.map(serializeNode).join('')}\n\n`
    }

    if (node.type === 'paragraph') {
      return `${node.children.map(serializeNode).join('')}\n\n`
    }

    if (node.type === 'list') {
      return node.children.map((listItem: any, index: number) => {
        const prefix = node.listType === 'number' ? `${index + 1}. ` : '- '
        return `${prefix}${listItem.children.map(serializeNode).join('')}\n`
      }).join('') + '\n'
    }

    if (node.type === 'quote') {
      return `> ${node.children.map(serializeNode).join('')}\n\n`
    }

    if (node.type === 'block' && node.fields?.blockType === 'code-block') {
      return `\`\`\`${node.fields.language}\n${node.fields.code}\n\`\`\`\n\n`
    }

    if (node.type === 'block') {
      return `\n<!-- Block: ${node.fields?.blockType} -->\n\n`
    }

    return ''
  }

  return editorState.root.children.map(serializeNode).join('').trim()
}
