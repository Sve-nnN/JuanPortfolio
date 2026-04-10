import { generateSchema } from '../../../src/utilities/generateSchema'
import { describe, it, expect } from 'vitest'
import type { Page, Post } from '../../../src/payload-types'

describe('generateSchema', () => {
  it('should return WebPage schema for a generic Page', () => {
    const mockPage: Partial<Page> = {
      title: 'Home Page',
      meta: {
        description: 'A description',
      },
      updatedAt: '2023-01-01T00:00:00.000Z',
    }
    const schema = generateSchema({ doc: mockPage, collection: 'pages', url: 'https://example.com' })
    
    expect(schema?.['@type']).toBe('WebPage')
    expect(schema?.name).toBe('Home Page')
  })

  it('should return Article schema for a Post', () => {
    const mockPost: Partial<Post> = {
      title: 'My Blog Post',
      meta: {
        description: 'Blog description',
      },
      publishedAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z',
      authors: [], // Simplified for now
    }
    
    const schema = generateSchema({ doc: mockPost, collection: 'posts', url: 'https://example.com/posts/my-blog-post' })
    
    expect(schema?.['@type']).toBe('BlogPosting')
    expect(schema?.headline).toBe('My Blog Post')
    expect(schema?.datePublished).toBe('2023-01-01T00:00:00.000Z')
    expect(schema?.dateModified).toBe('2023-01-02T00:00:00.000Z')
  })

  it('should extract author from Post', () => {
    const mockPost: Partial<Post> = {
      title: 'Post with Author',
      // @ts-expect-error - Mocking author
      authors: [
        {
          name: 'Jane Doe',
        }
      ]
    }
    const schema = generateSchema({ doc: mockPost, collection: 'posts', url: 'https://example.com' })
    expect(schema?.author?.name).toBe('Jane Doe')
  })

  it('should include BreadcrumbList when breadcrumbs are provided', () => {
    const mockPage: Partial<Page> = { title: 'Deep Page' }
    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: 'Deep Page', url: '/deep-page' }
    ]
    const schema = generateSchema({ 
      doc: mockPage, 
      collection: 'pages', 
      url: 'https://example.com/deep-page',
      breadcrumbs
    })
    
    // Schema might be an array (Graph) or single object. 
    // If we return graph, we need to check the array.
    // For now, let's assume we return an object or array.
    
    const graph = Array.isArray(schema?.['@graph']) ? schema['@graph'] : [schema]
    const breadcrumbSchema = graph.find((s: any) => s['@type'] === 'BreadcrumbList')
    
    expect(breadcrumbSchema).toBeDefined()
    expect(breadcrumbSchema.itemListElement).toHaveLength(2)
    expect(breadcrumbSchema.itemListElement[0].name).toBe('Home')
  })
})
