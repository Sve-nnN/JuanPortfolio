/**
 * Transforms a Cloudinary URL with optimization parameters.
 * Pure function safe for both client and server.
 * @param url - The original Cloudinary URL.
 * @param options - Transformation options (width, height, crop, etc.)
 * @returns Optimized URL.
 */
export function getOptimizedCloudinaryUrl(
  url: string | null | undefined,
  options: {
    width?: number
    height?: number
    crop?: string
    format?: 'avif' | 'webp' | 'auto'
    quality?: 'auto' | string
  } = {},
): string {
  if (!url) return ''
  if (!url.includes('cloudinary.com')) return url

  const { width, height, crop = 'limit', format = 'avif', quality = 'auto' } = options

  // Construct transformation string
  const transformations = []
  if (width) transformations.push(`w_${width}`)
  if (height) transformations.push(`h_${height}`)
  if (width || height) transformations.push(`c_${crop}`)
  transformations.push(`f_${format}`)
  transformations.push(`q_${quality}`)

  const transformationString = transformations.join(',')

  // Insert transformations into URL
  // URL format: .../upload/v123456789/filename.jpg
  // Target: .../upload/w_300,f_auto/v123456789/filename.jpg
  return url.replace('/upload/', `/upload/${transformationString}/`)
}
