import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TableOfContents } from '@/components/TableOfContents'

const headings = [
  { id: 'h1', text: 'Heading 1', level: 2 },
  { id: 'h2', text: 'Subheading', level: 3 },
]

describe('TableOfContents', () => {
  it('renders headings and links', () => {
    render(<TableOfContents headings={headings as any} />)

    expect(screen.getByText('Contenido')).toBeTruthy()
    expect(screen.getByText('Heading 1')).toBeTruthy()
    expect(screen.getByText('Subheading')).toBeTruthy()
    expect(screen.getAllByRole('link').length >= 2).toBe(true)
  })
})
