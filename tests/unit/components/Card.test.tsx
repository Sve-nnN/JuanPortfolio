import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Card, CardPostData } from '../../../src/components/Card'

// Mock the useRouter hook
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('Card component', () => {
  const mockDoc: any = {
    slug: 'test-post',
    title: 'Test Post',
    categories: [{ id: 'tech', title: 'Category 1', slug: 'tech' }],
    meta: {
      description: 'This is a test post.',
      image: {
        id: '1',
        filename: 'test.jpg',
        alt: 'Test Image',
        url: '/test.jpg',
        width: 1000,
        height: 800,
        updatedAt: '',
        createdAt: '',
      },
    },
  }

  it('renders the card with all props', () => {
    render(<Card doc={mockDoc} relationTo="posts" showCategories />)
    screen.debug()
    expect(screen.getByText('Test Post')).toBeInTheDocument()
    expect(screen.getByText('This is a test post.')).toBeInTheDocument()
    expect(screen.getByText('Category 1')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/blog/tech/test-post')
  })

  it('renders the card with minimal props', () => {
    const minimalDoc: CardPostData = {
      slug: 'minimal-post',
      title: 'Minimal Post',
    }
    render(<Card doc={minimalDoc} relationTo="posts" />)
    screen.debug()
    expect(screen.getByText('Minimal Post')).toBeInTheDocument()
    expect(screen.queryByText('This is a test post.')).not.toBeInTheDocument()
    expect(screen.queryByText('Category 1')).not.toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/blog/general/minimal-post')
  })
})
