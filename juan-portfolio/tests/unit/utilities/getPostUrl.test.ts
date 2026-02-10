import { describe, it, expect } from 'vitest'
import { getPostUrl } from '../../../src/utilities/getPostUrl'
import type { Post } from '../../../src/payload-types'

const BASE_URL = 'https://juan-tech.com/blog'

describe('getPostUrl utility', () => {
  it('generates URL with category from meta_extras.categories', () => {
    const post = {
      slug: 'my-awesome-post',
      meta_extras: {
        categories: [
          {
            id: 'javascript',
            slug: 'javascript',
            title: 'JavaScript',
            updatedAt: '',
            createdAt: '',
          },
          { id: 'react', slug: 'react', title: 'React', updatedAt: '', createdAt: '' },
        ],
      },
    } as Partial<Post> as Post

    const url = getPostUrl(post)
    expect(url).toBe(`${BASE_URL}/javascript/my-awesome-post`)
  })

  it('uses first category when multiple categories exist', () => {
    const post = {
      slug: 'multi-category-post',
      meta_extras: {
        categories: [
          {
            id: 'typescript',
            slug: 'typescript',
            title: 'TypeScript',
            updatedAt: '',
            createdAt: '',
          },
          { id: 'nodejs', slug: 'nodejs', title: 'Node.js', updatedAt: '', createdAt: '' },
          { id: 'web', slug: 'web', title: 'Web', updatedAt: '', createdAt: '' },
        ],
      },
    } as Partial<Post> as Post

    const url = getPostUrl(post)
    expect(url).toBe(`${BASE_URL}/typescript/multi-category-post`)
  })

  it('falls back to "general" when no categories exist', () => {
    const post = {
      slug: 'no-category-post',
      meta_extras: {
        categories: [],
      },
    } as Partial<Post> as Post

    const url = getPostUrl(post)
    expect(url).toBe(`${BASE_URL}/general/no-category-post`)
  })

  it('falls back to "general" when meta_extras is undefined', () => {
    const post = {
      slug: 'undefined-meta-post',
    } as Partial<Post> as Post

    const url = getPostUrl(post)
    expect(url).toBe(`${BASE_URL}/general/undefined-meta-post`)
  })

  it('falls back to "general" when categories is undefined', () => {
    const post = {
      slug: 'no-categories-field',
      meta_extras: {},
    } as Partial<Post> as Post

    const url = getPostUrl(post)
    expect(url).toBe(`${BASE_URL}/general/no-categories-field`)
  })

  it('handles category as string ID', () => {
    const post = {
      slug: 'string-category-post',
      meta_extras: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        categories: ['python', 'django'] as any,
      },
    } as Partial<Post> as Post

    const url = getPostUrl(post)
    expect(url).toBe(`${BASE_URL}/python/string-category-post`)
  })

  it('handles mixed category types (object and string)', () => {
    const post = {
      slug: 'mixed-category-post',
      meta_extras: {
        categories: [
          { id: 'vue', slug: 'vue', title: 'Vue.js', updatedAt: '', createdAt: '' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          'nuxt' as any,
        ],
      },
    } as Partial<Post> as Post

    const url = getPostUrl(post)
    expect(url).toBe(`${BASE_URL}/vue/mixed-category-post`)
  })

  it('handles special characters in slug', () => {
    const post = {
      slug: 'post-with-special-chars',
      meta_extras: {
        categories: [
          { id: 'tutorials', slug: 'tutorials', title: 'Tutorials', updatedAt: '', createdAt: '' },
        ],
      },
    } as Partial<Post> as Post

    const url = getPostUrl(post)
    expect(url).toBe(`${BASE_URL}/tutorials/post-with-special-chars`)
  })

  it('preserves slug format exactly as provided', () => {
    const post = {
      slug: 'How-To-Build-REST-API',
      meta_extras: {
        categories: [{ id: 'api', slug: 'api', title: 'API', updatedAt: '', createdAt: '' }],
      },
    } as Partial<Post> as Post

    const url = getPostUrl(post)
    expect(url).toBe(`${BASE_URL}/api/How-To-Build-REST-API`)
  })
})