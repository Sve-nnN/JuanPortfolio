import { v2 as cloudinary } from 'cloudinary'
import { getOptimizedCloudinaryUrl } from './cloudinaryUrl'

/**
 * Service to handle Cloudinary operations.
 * Implements Singleton pattern.
 */
export class CloudinaryService {
  private static instance: CloudinaryService

  private constructor() {
    cloudinary.config({
      cloudinary_url: process.env.CLOUDINARY_URL,
    })
  }

  public static getInstance(): CloudinaryService {
    if (!CloudinaryService.instance) {
      CloudinaryService.instance = new CloudinaryService()
    }
    return CloudinaryService.instance
  }

  /**
   * Uploads an image to Cloudinary.
   * @param fileBuffer - The file buffer to upload.
   * @param fileName - Original filename.
   * @returns Promise with the upload result.
   */
  public async uploadImage(fileBuffer: Buffer, fileName: string): Promise<string | null> {
    return new Promise((resolve, _reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'portfolio',
          public_id: fileName.split('.')[0],
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error)
            return resolve(null)
          }
          resolve(result?.secure_url || null)
        },
      )

      uploadStream.end(fileBuffer)
    })
  }

  /**
   * Uploads an image from a URL to Cloudinary.
   * @param url - Source image URL.
   * @param fileName - public_id for Cloudinary.
   * @returns Promise with the secure URL.
   */
  public async uploadFromUrl(url: string, fileName: string): Promise<string | null> {
    try {
      const result = await cloudinary.uploader.upload(url, {
        folder: 'portfolio',
        public_id: fileName.split('.')[0],
        resource_type: 'auto',
      })
      return result.secure_url
    } catch (error) {
      console.error('Cloudinary Upload from URL Error:', error)
      return null
    }
  }

  /**
   * Transforms a Cloudinary URL with optimization parameters.
   * @param url - The original Cloudinary URL.
   * @param options - Transformation options (width, height, crop, etc.)
   * @returns Optimized URL.
   */
  public getOptimizedUrl(
    url: string | null | undefined,
    options: {
      width?: number
      height?: number
      crop?: string
      format?: 'avif' | 'webp' | 'auto'
      quality?: 'auto' | string
    } = {},
  ): string {
    return getOptimizedCloudinaryUrl(url, options)
  }
}

export const cloudinaryService = CloudinaryService.getInstance()
