import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import { JsonLd } from '../../../src/components/JsonLd'
import { SGEAtomicAnswer } from '../../../src/components/SGEAtomicAnswer'
import { FAQBlock } from '../../../src/blocks/FAQ/Component'

// Mock framer-motion to avoid issues in unit tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

// Mock Shadcn Accordion components
vi.mock('@/components/ui/accordion', () => ({
  Accordion: ({ children }: any) => <div>{children}</div>,
  AccordionItem: ({ children }: any) => <div>{children}</div>,
  AccordionTrigger: ({ children }: any) => <div>{children}</div>,
  AccordionContent: ({ children }: any) => <div>{children}</div>,
}))

describe('GEO Implementation Components', () => {
  describe('JsonLd Component', () => {
    it('should auto-generate BlogPosting schema when post is provided', () => {
      const mockPost: any = {
        title: 'Test Post',
        slug: 'test-post',
        createdAt: '2026-01-01T00:00:00.000Z',
        populatedAuthors: [
          {
            name: 'Juan Carlos',
            slug: 'juan-carlos',
            jobTitle: 'Software Engineer',
          }
        ],
        meta: {
          description: 'A test post description',
        }
      }

      const { container } = render(<JsonLd post={mockPost} />)
      const script = container.querySelector('script[type="application/ld+json"]')
      
      expect(script).toBeTruthy()
      const content = JSON.parse(script?.innerHTML || '{}')
      
      const blogPosting = content['@graph'].find((s: any) => s['@type'] === 'BlogPosting')
      expect(blogPosting).toBeTruthy()
      expect(blogPosting.headline).toBe('Test Post')
      expect(blogPosting.author[0].name).toBe('Juan Carlos')
      expect(blogPosting.author[0].jobTitle).toBe('Software Engineer')
    })

    it('should include FAQPage schema if faqs are present in blocks', () => {
      const mockBlocks: any = [
        {
          blockType: 'faq',
          faqs: [
            { question: 'What is SEO?', answer: 'Search Engine Optimization.' }
          ]
        }
      ]

      const { container } = render(<JsonLd blocks={mockBlocks} />)
      const content = JSON.parse(container.querySelector('script')?.innerHTML || '{}')
      
      const faqPage = content['@graph'].find((s: any) => s['@type'] === 'FAQPage')
      expect(faqPage).toBeTruthy()
      expect(faqPage.mainEntity.some((f: any) => f.name === 'What is SEO?')).toBeTruthy()
    })
  })

  describe('SGEAtomicAnswer Component', () => {
    it('should render summary text correctly', () => {
      const summary = "This is a citable summary for SGE."
      const { getByText } = render(<SGEAtomicAnswer summary={summary} />)
      
      expect(getByText(summary)).toBeTruthy()
      expect(getByText(/Resumen Ejecutivo/i)).toBeTruthy()
    })

    it('should return null if summary is empty', () => {
      const { container } = render(<SGEAtomicAnswer summary="" />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('FAQBlock Component', () => {
    it('should render dynamic title in H2 and questions in H3', () => {
      const faqs = [{ question: 'Is this SEO friendly?', answer: 'Yes, it uses H3 tags.' }]
      const title = 'Preguntas frecuentes sobre SEO'
      
      const { getByText, container } = render(<FAQBlock title={title} faqs={faqs} />)
      
      const h2 = container.querySelector('h2')
      const h3 = container.querySelector('h3')
      
      expect(h2?.textContent?.trim()).toBe(title)
      expect(h3?.textContent?.trim()).toBe(faqs[0].question)
      expect(getByText(faqs[0].answer)).toBeTruthy()
    })
  })
})
