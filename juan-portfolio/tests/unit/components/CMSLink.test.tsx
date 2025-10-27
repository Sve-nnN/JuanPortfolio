import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CMSLink } from '../../../src/components/Link'

describe('CMSLink component', () => {
  it('renders an inline link with a custom URL', () => {
    render(<CMSLink type="custom" url="/custom-url" label="Custom Link" />)
    const link = screen.getByRole('link', { name: 'Custom Link' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/custom-url')
  })

  it('renders a button link with a custom URL', () => {
    render(<CMSLink type="custom" url="/button-url" label="Button Link" appearance="default" />)
    const link = screen.getByRole('link', { name: 'Button Link' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/button-url')
  })

  it('renders a link to a page reference', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page = { id: '1', slug: 'test-page', title: 'Test Page' } as any
    render(<CMSLink type="reference" reference={{ relationTo: 'pages', value: page }} />)
    const link = screen.getByRole('link', { name: 'Test Page' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test-page')
  })

  it('renders a link to a post reference', () => {
    const post = {
      id: '1',
      slug: 'test-post',
      title: 'Test Post',
      meta_extras: {
        categories: [{ id: 'tech', slug: 'tech', title: 'Tech' }],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    render(<CMSLink type="reference" reference={{ relationTo: 'posts', value: post }} />)
    const link = screen.getByRole('link', { name: 'Test Post' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/blog/tech/test-post')
  })

  it('renders a link with a newTab prop', () => {
    render(<CMSLink type="custom" url="/new-tab" label="New Tab" newTab />)
    const link = screen.getByRole('link', { name: 'New Tab' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('derives the label from the URL if not provided', () => {
    render(<CMSLink type="custom" url="/derived-label" />)
    const link = screen.getByRole('link', { name: 'derived label' })
    expect(link).toBeInTheDocument()
  })
})
