import { extractText } from './extractText'

export interface ExtractedFaq {
  question: string
  answer: string
}

/**
 * Walks Payload lexical content and collects question/answer pairs from any
 * embedded FAQ blocks (blockType 'faq'). Used to emit FAQPage JSON-LD on posts
 * that contain an FAQ block. SEO audit jun-2026, issue #46.
 */
export function extractFaqsFromLexical(lexicalData: unknown): ExtractedFaq[] {
  const out: ExtractedFaq[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const visit = (node: any): void => {
    if (!node || typeof node !== 'object') return
    if (node.root) visit(node.root)

    const fields = node.fields
    if (node.type === 'block' && fields?.blockType === 'faq' && Array.isArray(fields.faqs)) {
      for (const f of fields.faqs) {
        const question = typeof f?.question === 'string' ? f.question.trim() : ''
        const answer = extractText(f?.answer).trim()
        if (question && answer) out.push({ question, answer })
      }
    }

    if (Array.isArray(node.children)) node.children.forEach(visit)
  }

  visit(lexicalData)
  return out
}
