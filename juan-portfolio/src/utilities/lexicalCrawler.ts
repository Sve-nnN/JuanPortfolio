interface LexicalNode {
  type: string
  children?: LexicalNode[]
  fields?: {
    linkType?: string
    url?: string
  }
}

/**
 * Analiza un objeto JSON de Lexical y cuenta cuántos enlaces internos contiene.
 * Un enlace se considera interno si el linkType es 'internal'.
 */
export const countInternalLinks = (lexicalData: { root?: LexicalNode } | null): number => {
  let count = 0

  const traverse = (node: LexicalNode) => {
    if (!node) return

    // Detectar enlaces de Payload
    if (node.type === 'link' && node.fields?.linkType === 'internal') {
      count++
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(traverse)
    }
  }

  // Lexical data suele venir con un root
  if (lexicalData && lexicalData.root) {
    traverse(lexicalData.root)
  }

  return count
}
