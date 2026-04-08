import type { FAQItem, Schema } from './types'

export function generateFAQSchema(faqs: FAQItem[]): Schema | null {
  if (!faqs || faqs.length < 2) {
    return null
  }

  const mainEntity = faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  }
}
