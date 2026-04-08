import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cloudinaryService } from '../../../src/utilities/cloudinary'
import { v2 as cloudinary } from 'cloudinary'

// Mock cloudinary v2
vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: vi.fn((options, callback) => {
        return {
          end: vi.fn(() => {
            callback(null, { secure_url: 'https://cloudinary.com/test.jpg' })
          }),
        }
      }),
      upload: vi.fn().mockResolvedValue({ secure_url: 'https://cloudinary.com/test-url.jpg' }),
    },
  },
}))

describe('CloudinaryService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should be a singleton', () => {
    const instance1 = cloudinaryService
    const instance2 = cloudinaryService
    expect(instance1).toBe(instance2)
  })

  it('should upload an image via stream', async () => {
    const buffer = Buffer.from('fake-image-data')
    const url = await cloudinaryService.uploadImage(buffer, 'test-image.jpg')

    expect(cloudinary.uploader.upload_stream).toHaveBeenCalled()
    expect(url).toBe('https://cloudinary.com/test.jpg')
  })

  it('should upload an image from URL', async () => {
    const sourceUrl = 'https://example.com/image.jpg'
    const url = await cloudinaryService.uploadFromUrl(sourceUrl, 'test-image.jpg')

    expect(cloudinary.uploader.upload).toHaveBeenCalledWith(sourceUrl, expect.any(Object))
    expect(url).toBe('https://cloudinary.com/test-url.jpg')
  })

  it('should return null if upload stream fails', async () => {
    // Override mock for this test
    vi.mocked(cloudinary.uploader.upload_stream).mockImplementationOnce(((options: any, callback: any) => {
      // In case only callback is provided as first arg
      const cb = typeof options === 'function' ? options : callback
      return {
        end: vi.fn(() => {
          cb(new Error('Upload failed'), null)
        }),
      } as any
    }) as any)

    const buffer = Buffer.from('fake-data')
    const url = await cloudinaryService.uploadImage(buffer, 'fail.jpg')
    expect(url).toBeNull()
  })
})
