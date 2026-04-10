/**
 * Extrae texto plano de un valor que puede ser un string o un objeto JSON de Lexical.
 */
export const extractText = (val: unknown): string => {
  if (typeof val === 'string') return val
  if (!val || typeof val !== 'object') return ''

  let text = ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const traverse = (node: any) => {
    if (typeof node === 'string') {
      text += node + ' '
    } else if (node && typeof node === 'object') {
      if (node.text) text += node.text + ' '
      if (node.children) node.children.forEach(traverse)
      if (node.root) traverse(node.root)
    }
  }
  traverse(val)
  return text.trim().replace(/\s+/g, ' ')
}
