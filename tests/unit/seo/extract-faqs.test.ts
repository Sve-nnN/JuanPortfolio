import { describe, it, expect } from 'vitest'
import { extractFaqsFromLexical } from '@/utilities/extractFaqs'

/**
 * Regression suite for SEO audit jun-2026 issue #46: posts that embed an FAQ
 * block should expose their Q&A pairs so a FAQPage can be emitted.
 */
const lexicalWithFaq = {
  root: {
    type: 'root',
    children: [
      { type: 'paragraph', children: [{ text: 'Intro text' }] },
      {
        type: 'block',
        fields: {
          blockType: 'faq',
          title: 'FAQ',
          faqs: [
            {
              question: 'What is technical SEO?',
              answer: { root: { children: [{ children: [{ text: 'It is the practice of...' }] }] } },
            },
            { question: 'Why does it matter?', answer: 'Because crawlers.' },
          ],
        },
      },
    ],
  },
}

describe('extractFaqsFromLexical (issue #46)', () => {
  it('extracts question/answer pairs from an embedded FAQ block', () => {
    const faqs = extractFaqsFromLexical(lexicalWithFaq)
    expect(faqs).toHaveLength(2)
    expect(faqs[0].question).toBe('What is technical SEO?')
    expect(faqs[0].answer).toContain('It is the practice of')
    expect(faqs[1].answer).toBe('Because crawlers.')
  })

  it('returns empty for content without FAQ blocks', () => {
    expect(extractFaqsFromLexical({ root: { children: [{ type: 'paragraph' }] } })).toEqual([])
    expect(extractFaqsFromLexical(null)).toEqual([])
  })

  it('skips FAQ entries missing a question or answer', () => {
    const faqs = extractFaqsFromLexical({
      root: {
        children: [
          {
            type: 'block',
            fields: { blockType: 'faq', faqs: [{ question: '', answer: 'x' }, { question: 'Q', answer: '' }] },
          },
        ],
      },
    })
    expect(faqs).toEqual([])
  })
})
