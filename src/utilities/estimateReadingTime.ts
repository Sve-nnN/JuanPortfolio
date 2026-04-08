type LexicalNode = {
  text?: string
  children?: unknown[]
  [key: string]: unknown
}

export function extractText(node: unknown): string {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map((n) => extractText(n)).join(' ')
  if (typeof node === 'object' && node !== null) {
    const nodeObj = node as LexicalNode
    // Common lexical shape: { type: 'root', children: [...] } or paragraph nodes with children
    if ('text' in nodeObj && typeof nodeObj.text === 'string') return nodeObj.text
    if ('children' in nodeObj && Array.isArray(nodeObj.children))
      return nodeObj.children.map(extractText).join(' ')
    // fallback: join values
    return Object.values(nodeObj)
      .map(extractText)
      .join(' ')
  }
  return ''
}

export function estimateReadingTimeFromLexical(content: unknown) {
  try {
    const text = extractText(content)
    const words = text.trim().split(/\s+/).filter(Boolean).length
    const minutes = Math.max(1, Math.round(words / 200))
    return { words, minutes }
  } catch (_e) {
    return { words: 0, minutes: 1 }
  }
}
