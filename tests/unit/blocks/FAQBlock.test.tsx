import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { FAQBlock } from '@/blocks/FAQ/Component'

// Mock the Lucide icons
vi.mock('lucide-react', () => ({
  HelpCircle: () => <div data-testid="help-circle-icon" />,
}))

// Mock RichText
vi.mock('@/components/RichText', () => ({
  default: ({ data }: { data: any }) => <div data-testid="rich-text">{JSON.stringify(data)}</div>,
}))

describe('FAQBlock', () => {
  const mockFaqs = [
    {
      question: 'What is Next.js?',
      answer: 'Next.js is a React framework for building full-stack web applications.',
    },
    {
      question: 'Is Payload CMS 3.0 out?',
      answer: 'Yes, Payload 3.0 is stable and built on Next.js.',
    },
  ]

  it('renders correctly with given faqs', () => {
    render(<FAQBlock title="Testing FAQs" faqs={mockFaqs} />)
    
    expect(screen.getByText('Testing FAQs')).toBeDefined()
    expect(screen.getByText('What is Next.js?')).toBeDefined()
    expect(screen.getByText('Is Payload CMS 3.0 out?')).toBeDefined()
    expect(screen.getByText(mockFaqs[0].answer)).toBeDefined()
    expect(screen.getByText(mockFaqs[1].answer)).toBeDefined()
  })

  it('renders nothing if faqs are empty', () => {
    const { container } = render(<FAQBlock faqs={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('handles Lexical objects as answers using RichText', () => {
    const lexicalFaqs = [
      {
        question: 'Lexical FAQ?',
        answer: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [{ type: 'text', text: 'This is a Lexical object.' }]
              }
            ]
          }
        }
      }
    ]
    
    render(<FAQBlock faqs={lexicalFaqs} />)
    expect(screen.getByText('Lexical FAQ?')).toBeDefined()
    expect(screen.getByTestId('rich-text')).toBeDefined()
  })
})
