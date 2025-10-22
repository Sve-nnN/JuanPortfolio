export function extractText(node: unknown): string {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map((n) => extractText(n)).join(' ')
  if (typeof node === 'object' && node !== null) {
    // Common lexical shape: { type: 'root', children: [...] } or paragraph nodes with children
    if ('text' in (node as any) && typeof (node as any).text === 'string') return (node as any).text
    if ('children' in (node as any) && Array.isArray((node as any).children))
      return (node as any).children.map(extractText).join(' ')
    // fallback: join values
    return Object.values(node as any)
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
