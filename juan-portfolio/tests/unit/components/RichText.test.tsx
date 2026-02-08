import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import RichText from '../../../src/components/RichText'

describe('RichText component', () => {
  it('renders basic text content', () => {
    const richText = {
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [
              {
                type: 'text',
                version: 1,
                text: 'Hello, world!',
                format: 0,
                mode: 'normal',
                style: '',
                detail: 0,
              },
            ],
            format: '',
            indent: 0,
            direction: null,
          },
        ],
        format: '',
        indent: 0,
        direction: null,
      },
    } as any

    const { container } = render(<RichText data={richText} enableGutter={false} />)
    expect(container.textContent).toContain('Hello, world!')
  })

  it('renders heading elements', () => {
    const richText = {
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'heading',
            version: 1,
            tag: 'h2',
            children: [
              {
                type: 'text',
                version: 1,
                text: 'Test Heading',
                format: 0,
                mode: 'normal',
                style: '',
                detail: 0,
              },
            ],
            format: '',
            indent: 0,
            direction: null,
          },
        ],
        format: '',
        indent: 0,
        direction: null,
      },
    } as any

    const { container } = render(<RichText data={richText} enableGutter={false} />)
    const heading = container.querySelector('h2')
    expect(heading).toBeTruthy()
    expect(heading?.textContent).toBe('Test Heading')
  })

  it('renders internal links to posts with category URLs', () => {
    const richText = {
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [
              {
                type: 'link',
                version: 1,
                fields: {
                  linkType: 'internal',
                  doc: {
                    relationTo: 'posts',
                    value: {
                      id: '123',
                      slug: 'my-post',
                      meta_extras: {
                        categories: [{ slug: 'javascript', title: 'JavaScript' }],
                      },
                    },
                  },
                },
                children: [
                  {
                    type: 'text',
                    version: 1,
                    text: 'Read this post',
                    format: 0,
                    mode: 'normal',
                    style: '',
                    detail: 0,
                  },
                ],
                format: '',
                indent: 0,
                direction: null,
              },
            ],
            format: '',
            indent: 0,
            direction: null,
          },
        ],
        format: '',
        indent: 0,
        direction: null,
      },
    } as any

    const { container } = render(<RichText data={richText} enableGutter={false} />)
    const link = container.querySelector('a')
    expect(link).toBeTruthy()
    expect(link?.getAttribute('href')).toBe('/blog/javascript/my-post')
    expect(link?.textContent).toBe('Read this post')
  })

  it('renders internal links to posts with fallback to general category', () => {
    const richText = {
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [
              {
                type: 'link',
                version: 1,
                fields: {
                  linkType: 'internal',
                  doc: {
                    relationTo: 'posts',
                    value: {
                      id: '456',
                      slug: 'uncategorized-post',
                      meta_extras: {
                        categories: [],
                      },
                    },
                  },
                },
                children: [
                  {
                    type: 'text',
                    version: 1,
                    text: 'No category post',
                    format: 0,
                    mode: 'normal',
                    style: '',
                    detail: 0,
                  },
                ],
                format: '',
                indent: 0,
                direction: null,
              },
            ],
            format: '',
            indent: 0,
            direction: null,
          },
        ],
        format: '',
        indent: 0,
        direction: null,
      },
    } as any

    const { container } = render(<RichText data={richText} enableGutter={false} />)
    const link = container.querySelector('a')
    expect(link).toBeTruthy()
    expect(link?.getAttribute('href')).toBe('/blog/general/uncategorized-post')
  })

  it('renders internal links to pages', () => {
    const richText = {
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [
              {
                type: 'link',
                version: 1,
                fields: {
                  linkType: 'internal',
                  doc: {
                    relationTo: 'pages',
                    value: {
                      id: '789',
                      slug: 'about-us',
                    },
                  },
                },
                children: [
                  {
                    type: 'text',
                    version: 1,
                    text: 'About page',
                    format: 0,
                    mode: 'normal',
                    style: '',
                    detail: 0,
                  },
                ],
                format: '',
                indent: 0,
                direction: null,
              },
            ],
            format: '',
            indent: 0,
            direction: null,
          },
        ],
        format: '',
        indent: 0,
        direction: null,
      },
    } as any

    const { container } = render(<RichText data={richText} enableGutter={false} />)
    const link = container.querySelector('a')
    expect(link).toBeTruthy()
    expect(link?.getAttribute('href')).toBe('/about-us')
  })

  it('renders external links', () => {
    const richText = {
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [
              {
                type: 'link',
                version: 1,
                fields: {
                  linkType: 'custom',
                  url: 'https://example.com',
                  newTab: true,
                },
                children: [
                  {
                    type: 'text',
                    version: 1,
                    text: 'External link',
                    format: 0,
                    mode: 'normal',
                    style: '',
                    detail: 0,
                  },
                ],
                format: '',
                indent: 0,
                direction: null,
              },
            ],
            format: '',
            indent: 0,
            direction: null,
          },
        ],
        format: '',
        indent: 0,
        direction: null,
      },
    } as any

    const { container } = render(<RichText data={richText} enableGutter={false} />)
    const link = container.querySelector('a')
    expect(link).toBeTruthy()
    expect(link?.getAttribute('href')).toBe('https://example.com')
    expect(link?.getAttribute('target')).toBe('_blank')
  })

  it('renders formatted text (bold, italic)', () => {
    const richText = {
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [
              {
                type: 'text',
                version: 1,
                text: 'Bold text',
                format: 1, // Bold format
                mode: 'normal',
                style: '',
                detail: 0,
              },
              {
                type: 'text',
                version: 1,
                text: ' and ',
                format: 0,
                mode: 'normal',
                style: '',
                detail: 0,
              },
              {
                type: 'text',
                version: 1,
                text: 'italic text',
                format: 2, // Italic format
                mode: 'normal',
                style: '',
                detail: 0,
              },
            ],
            format: '',
            indent: 0,
            direction: null,
          },
        ],
        format: '',
        indent: 0,
        direction: null,
      },
    } as any

    const { container } = render(<RichText data={richText} enableGutter={false} />)
    expect(container.querySelector('strong')).toBeTruthy()
    expect(container.querySelector('em')).toBeTruthy()
  })

  it('renders lists', () => {
    const richText = {
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'list',
            version: 1,
            listType: 'bullet',
            tag: 'ul',
            start: 1,
            children: [
              {
                type: 'listitem',
                version: 1,
                value: 1,
                children: [
                  {
                    type: 'text',
                    version: 1,
                    text: 'First item',
                    format: 0,
                    mode: 'normal',
                    style: '',
                    detail: 0,
                  },
                ],
                format: '',
                indent: 0,
                direction: null,
              },
              {
                type: 'listitem',
                version: 1,
                value: 2,
                children: [
                  {
                    type: 'text',
                    version: 1,
                    text: 'Second item',
                    format: 0,
                    mode: 'normal',
                    style: '',
                    detail: 0,
                  },
                ],
                format: '',
                indent: 0,
                direction: null,
              },
            ],
            format: '',
            indent: 0,
            direction: null,
          },
        ],
        format: '',
        indent: 0,
        direction: null,
      },
    } as any

    const { container } = render(<RichText data={richText} enableGutter={false} />)
    const list = container.querySelector('ul')
    expect(list).toBeTruthy()
    const items = list?.querySelectorAll('li')
    expect(items?.length).toBe(2)
  })
})
