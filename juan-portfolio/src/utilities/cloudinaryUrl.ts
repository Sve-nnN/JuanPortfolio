/**
 * Generates a Cloudinary OG image URL (1200×630) with a text title overlay.
 * Uses the Array Google Font positioned bottom-left in white.
 * Strips any existing transformations from the source URL before applying.
 *
 * @param url   - Any Cloudinary image URL (with or without existing transforms)
 * @param title - Page / post title to render as overlay
 */
export function getCloudinaryOgWithTitle(url: string, title: string): string {
  if (!url || !url.includes('cloudinary.com')) return url

  const uploadIndex = url.indexOf('/upload/')
  if (uploadIndex === -1) return url

  const baseUrl = url.substring(0, uploadIndex)
  const afterUpload = url.substring(uploadIndex + '/upload/'.length)

  // Strip existing transformation segments to isolate the raw public_id.
  // Transformation segments start with a 1-3 char prefix + underscore (w_, h_, l_, fl_…).
  // Version segments match /^v\d+$/. Everything else is the public_id start.
  const segments = afterUpload.split('/')
  let pidStart = 0
  for (let i = 0; i < segments.length; i++) {
    if (/^v\d+$/.test(segments[i])) { pidStart = i; break }
    if (/^[a-z]{1,3}_/.test(segments[i])) { pidStart = i + 1; continue }
    pidStart = i; break
  }
  const publicId = segments.slice(pidStart).join('/')

  // Truncate long titles and URL-encode for the Cloudinary text parameter.
  const truncated = title.length > 65 ? `${title.slice(0, 62)}...` : title
  const encodedTitle = encodeURIComponent(truncated)

  // Transformation chain:
  //   1) Resize & fill-crop to standard OG dimensions, output as JPEG
  //   2) Array font title overlay, white, bottom-left, auto-fitted to image width
  // Array-Bold.woff2 is uploaded to Cloudinary as a raw authenticated asset (public_id: Array-Bold.woff2).
  // Custom font reference syntax: <public_id>_<size> (no extra style suffix needed — weight is baked in).
  const baseTransform = 'w_1200,h_630,c_fill,g_auto,f_jpg,q_auto:85'
  const textLayer = `l_text:Array-Bold.woff2_54:${encodedTitle},co_white,g_south_west,x_60,y_55,w_1080,c_fit`

  return `${baseUrl}/upload/${baseTransform}/${textLayer}/${publicId}`
}

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
