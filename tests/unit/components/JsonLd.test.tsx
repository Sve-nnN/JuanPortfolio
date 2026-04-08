import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { JsonLd } from '@/components/JsonLd'

describe('JsonLd', () => {
  it('correctly extracts FAQ data from plain strings', () => {
    const mockBlocks = [
      {
        blockType: 'faq',
        faqs: [
          {
            question: 'Is this a string?',
            answer: 'Yes, this is a plain string answer.'
          }
        ]
      }
    ]

    const { container } = render(<JsonLd blocks={mockBlocks} />)
    const script = container.querySelector('script')
    const json = JSON.parse(script?.innerHTML || '{}')
    
    const faqPage = json['@graph'].find((s: any) => s['@type'] === 'FAQPage')
    expect(faqPage).toBeDefined()
    expect(faqPage.mainEntity[0].name).toBe('Is this a string?')
    expect(faqPage.mainEntity[0].acceptedAnswer.text).toBe('Yes, this is a plain string answer.')
  })

  it('correctly extracts FAQ data from Lexical objects (compatibility)', () => {
    const mockBlocks = [
      {
        blockType: 'faq',
        faqs: [
          {
            question: 'Is this Lexical?',
            answer: {
              root: {
                children: [
                  {
                    type: 'paragraph',
                    children: [{ type: 'text', text: 'Yes, this is Lexical.' }]
                  }
                ]
              }
            }
          }
        ]
      }
    ]

    const { container } = render(<JsonLd blocks={mockBlocks} />)
    const script = container.querySelector('script')
    const json = JSON.parse(script?.innerHTML || '{}')
    
    const faqPage = json['@graph'].find((s: any) => s['@type'] === 'FAQPage')
    expect(faqPage.mainEntity[0].acceptedAnswer.text).toBe('Yes, this is Lexical.')
  })

  it('renders Article schema for posts', () => {
    const mockPost: any = {
      title: 'Test Post',
      slug: 'test-post',
      publishedAt: '2026-02-26T00:00:00.000Z',
      populatedAuthors: [{ name: 'Juan Carlos', slug: 'juan-carlos', jobTitle: 'Dev' }],
      categories: [{ slug: 'tech' }],
      content: { tldr: 'Summary of the post' }
    }

    const { container } = render(<JsonLd post={mockPost} />)
    const script = container.querySelector('script')
    const json = JSON.parse(script?.innerHTML || '{}')
    
    const article = json['@graph'].find((s: any) => s['@type'] === 'BlogPosting')
    expect(article).toBeDefined()
    expect(article.headline).toBe('Test Post')
    expect(article.description).toBe('Summary of the post')
  })
})
