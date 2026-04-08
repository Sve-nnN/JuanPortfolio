import { describe, it, expect, vi } from 'vitest'
import { getMediaUrl } from '../../../src/utilities/getMediaUrl'

// Mock getClientSideURL to keep it consistent
vi.mock('@/utilities/getURL', () => ({
  getClientSideURL: () => 'https://juan-tech.com',
}))

describe('SEO CDN Media Rules', () => {
  it('should format simple relative URLs correctly', () => {
    const url = getMediaUrl('/media/image.png')
    expect(url).toBe('https://juan-tech.com/media/image.png')
  })

  it('should preserve absolute URLs (like those from Cloudinary)', () => {
    const cloudinaryUrl = 'https://res.cloudinary.com/dmufha3qv/image/upload/v1/test.png'
    const url = getMediaUrl(cloudinaryUrl)
    expect(url).toBe(cloudinaryUrl)
  })

  it('should append cache tags correctly', () => {
    const url = getMediaUrl('/media/image.png', 'v123')
    expect(url).toBe('https://juan-tech.com/media/image.png?v123')
  })

  it('should handle absolute URLs with cache tags', () => {
    const cloudinaryUrl = 'https://res.cloudinary.com/dmufha3qv/image/upload/v1/test.png'
    const url = getMediaUrl(cloudinaryUrl, 'v123')
    expect(url).toBe(`${cloudinaryUrl}?v123`)
  })
})
