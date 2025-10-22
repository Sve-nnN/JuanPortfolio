import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PostHero } from '@/heros/PostHero'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPost: any = {
  id: '1',
  title: 'Test post',
  categories: [{ title: 'Category A' }],
  populatedAuthors: [{ id: 'u1', name: 'Alice' }],
  publishedAt: new Date().toISOString(),
}

describe('PostHero', () => {
  it('renders title, category badge and author/metadata', () => {
    render(<PostHero post={mockPost} excerpt={null} readingTime={3} />)

    const heading = screen.getByRole('heading', { level: 1 }) as HTMLElement
    expect(heading && heading.textContent && heading.textContent.includes('Test post')).toBe(true)

    const cat = screen.getByText('Category A')
    expect(cat).toBeTruthy()

    const autor = screen.getByText(/Autor/i)
    expect(autor).toBeTruthy()

    const lectura = screen.getByText(/Lectura/i)
    expect(lectura).toBeTruthy()
  })
})
