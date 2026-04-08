/**
 * Generates a Cloudinary OG image URL (1200×630) with a title overlay.
 *
 * Layout:
 *   1. Resize + fill-crop to 1200×630 (standard OG).
 *   2. Dark gradient scrim (portfolio/og-scrim) covers the bottom 300px so
 *      white text is readable on any image — bright or dark.
 *      The scrim is a 1200×300 PNG: transparent-at-top → ~82% black-at-bottom.
 *   3. Title text at bottom-right (50px inset), Array Bold 70px, white,
 *      auto-fitted to 1100px max width.
 *
 * Assets required in Cloudinary (uploaded once via scripts/):
 *   - raw/authenticated  Array-Bold.woff2  (custom font)
 *   - image/upload       portfolio/og-scrim (dark gradient PNG)
 *
 * @param url   - Any Cloudinary image URL (may already have transforms)
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
    if (/^v\d+$/.test(segments[i])) {
      pidStart = i
      break
    }
    if (/^[a-z]{1,3}_/.test(segments[i])) {
      pidStart = i + 1
      continue
    }
    pidStart = i
    break
  }
  const publicId = segments.slice(pidStart).join('/')

  // Truncate long titles and URL-encode for the Cloudinary text parameter.
  const truncated = title.length > 65 ? `${title.slice(0, 62)}...` : title
  const encodedTitle = encodeURIComponent(truncated)

  // Step 1 — base resize
  const baseTransform = 'w_1200,h_630,c_fill,g_auto,f_jpg,q_auto'

  // Step 2 — dark gradient scrim (1200×300, uploaded once).
  // Placed at the bottom; ensures text readability on bright images.
  // 1200×300 exact match avoids Cloudinary's megapixel limit on large upscales.
  const scrimLayer = 'l_portfolio:og-scrim/w_1200,h_300,c_fill/fl_layer_apply,g_south'

  // Step 3 — title text: Array Bold 70px, white, bottom-right with 50px inset.
  // fl_layer_apply positions the layer; gravity g_south_east + x_50,y_50 gives the inset.
  // w_1100 leaves 50px breathing room on the left side too.
  const textLayer = `l_text:Array-Bold.woff2_70_right:${encodedTitle},co_white,w_1100,c_fit/fl_layer_apply,g_south_east,x_50,y_50`

  return `${baseUrl}/upload/${baseTransform}/${scrimLayer}/${textLayer}/${publicId}`
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
