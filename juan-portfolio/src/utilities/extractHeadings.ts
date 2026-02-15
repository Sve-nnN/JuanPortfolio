export type Heading = { id: string; text: string; level: number }

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function extractText(node: unknown): string {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (Array.isArray(node)) {
    return node.map(extractText).join(' ').replace(/\s+/g, ' ').trim()
  }
  if (typeof node === 'object' && node !== null) {
    const anyNode = node as Record<string, unknown>
    if (typeof anyNode.text === 'string') return anyNode.text
    if (Array.isArray(anyNode.children)) {
      return (anyNode.children as unknown[]).map(extractText).join(' ').replace(/\s+/g, ' ').trim()
    }
    return Object.values(anyNode).map(extractText).join(' ').replace(/\s+/g, ' ').trim()
  }
  return ''
}

export function extractHeadingsFromLexical(content: unknown): Heading[] {
  const headings: Heading[] = []

  function walk(node: unknown) {
    if (!node) return
    if (Array.isArray(node)) return node.forEach(walk)
    if (typeof node === 'object' && node !== null) {
      const anyNode = node as Record<string, unknown>
      const type = anyNode.type || anyNode.tag || null
      if (
        type === 'heading' ||
        (typeof anyNode.tag === 'string' && String(anyNode.tag).match(/^h[1-6]$/i))
      ) {
        const tag = (anyNode.tag as string) || 'h2'
        const levelMatch = String(tag).match(/^h([1-6])$/i)
        const level = levelMatch ? Number(levelMatch[1]) : (anyNode.level as number) || 2
        const text = extractText(anyNode.children || anyNode)
        const baseId = slugify(text || 'heading')
        if (text) headings.push({ id: baseId, text: text.trim(), level })
      }

      // Special handling for custom blocks that should appear in TOC
      if (anyNode.type === 'block' && anyNode.fields) {
        const fields = anyNode.fields as any
        if (fields.blockType === 'faq' && fields.title) {
          const text = fields.title
          const baseId = slugify(text)
          headings.push({ id: baseId, text: text.trim(), level: 2 })
        }
      }

      if (Array.isArray(anyNode.children)) {
        ;(anyNode.children as unknown[]).forEach(walk)
      }

      if (anyNode.root && typeof anyNode.root === 'object') {
        walk(anyNode.root)
      }
    }
  }

  walk(content)

  // Filter to only H2-H4 and ensure unique IDs
  const filtered = headings.filter((h) => h.level >= 2 && h.level <= 4)

  // Make IDs unique by appending numeric suffix to duplicates
  const idCounts = new Map<string, number>()
  return filtered.map((heading) => {
    const baseId = heading.id
    const count = idCounts.get(baseId) || 0
    idCounts.set(baseId, count + 1)

    return {
      ...heading,
      id: count > 0 ? `${baseId}-${count}` : baseId,
    }
  })
}
