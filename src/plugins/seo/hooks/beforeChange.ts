import type { CollectionBeforeChangeHook, PayloadRequest } from 'payload'
import { analyzeSEO } from '../utils/seoAnalyzer'

interface BeforeChangeConfig {
  imageOptimization?: boolean
}

export const beforeChangeHook =
  ({ imageOptimization: _imageOptimization = true }: BeforeChangeConfig = {}) =>
    async ({ data, req, operation, originalDoc }: Parameters<CollectionBeforeChangeHook>[0]) => {
      try {
        // Merge incoming data with original document so we can safely read previous values on partial updates
        type MergedSEOData = {
          title?: unknown
          content?: unknown
          meta?: { title?: unknown; description?: unknown; keywords?: unknown } | undefined
          og?: { title?: unknown; description?: unknown; image?: unknown; type?: unknown } | undefined
          twitter?:
          | { title?: unknown; description?: unknown; image?: unknown; card?: unknown }
          | undefined
          excerpt?: string
          slug?: string
        }

        const mergedData: MergedSEOData = {
          ...(originalDoc || {}),
          ...(data || {}),
        }

        // Only run SEO analysis on create or update operations (when saving)
        // NOT on every field change (draft updates)
        const shouldAnalyze = operation === 'create' || operation === 'update'

        if (
          shouldAnalyze &&
          mergedData &&
          (mergedData.title || mergedData.content || mergedData.meta)
        ) {

          const currentLocale = (req as PayloadRequest)?.locale || 'en'
          const pickLocalized = (val: unknown): unknown => {
            if (val && typeof val === 'object' && (val as Record<string, unknown>)[currentLocale]) {
              return (val as Record<string, unknown>)[currentLocale]
            }
            return val
          }

          const titleVal = pickLocalized(mergedData.title)
          const contentVal = pickLocalized(mergedData.content)

          const analysis = await analyzeSEO({
            title: typeof titleVal === 'string' ? titleVal : undefined,
            content: contentVal,
            meta: mergedData.meta && {
              title: typeof mergedData.meta.title === 'string' ? mergedData.meta.title : undefined,
              description:
                typeof mergedData.meta.description === 'string'
                  ? mergedData.meta.description
                  : undefined,
              keywords:
                typeof mergedData.meta.keywords === 'string' ? mergedData.meta.keywords : undefined,
            },
            slug: typeof mergedData.slug === 'string' ? mergedData.slug : undefined,
          })

          // Store analysis results at root level
          data.seoScore = analysis.score
          data.seoAnalysis = analysis

        }

        // Ensure meta group exists
        if (!data.meta || typeof data.meta !== 'object') {
          data.meta = {}
        }

        // Auto-generate meta title from title if not provided
        if (mergedData.title && !data.meta.title) {
          const currentLocale = (req as PayloadRequest)?.locale || 'en'
          const titleVal = ((): unknown => {
            if (typeof mergedData.title === 'string') return mergedData.title
            if (mergedData.title && typeof mergedData.title === 'object') {
              const rec = mergedData.title as Record<string, unknown>
              const byLocale = rec[currentLocale]
              if (typeof byLocale === 'string') return byLocale
              const firstStr = Object.values(rec).find((v) => typeof v === 'string')
              return firstStr
            }
            return undefined
          })()
          if (typeof titleVal === 'string') data.meta.title = titleVal
        }

        // Auto-generate meta description from excerpt/content if not provided
        if (!data.meta.description) {
          if (mergedData.excerpt) {
            const ex = mergedData.excerpt as unknown
            const exStr = typeof ex === 'string' ? ex : undefined
            if (exStr) data.meta.description = exStr.substring(0, 160)
          } else if (mergedData.content) {
            // Extract text from Lexical content
            const currentLocale = (req as PayloadRequest)?.locale || 'en'
            const contentVal = ((): unknown => {
              const c = mergedData.content as unknown
              if (c && typeof c === 'object') {
                const rec = c as Record<string, unknown>
                if (rec[currentLocale]) return rec[currentLocale]
              }
              return c
            })()
            const text = extractTextFromLexical(contentVal)
            data.meta.description = text.substring(0, 160)
          }
        }

        // Ensure og group exists
        if (!data.og || typeof data.og !== 'object') {
          data.og = {}
        }

        // Auto-populate OG fields if not provided
        if (!data.og.title && mergedData.meta?.title) {
          data.og.title = mergedData.meta.title
        }
        if (!data.og.description && mergedData.meta?.description) {
          data.og.description = mergedData.meta.description
        }
        if (!data.og.type) {
          // Default to article type
          data.og.type = 'article'
        }

        // Ensure twitter group exists
        if (!data.twitter || typeof data.twitter !== 'object') {
          data.twitter = {}
        }

        // Auto-populate Twitter fields if not provided
        if (!data.twitter.title && mergedData.og?.title) {
          data.twitter.title = mergedData.og.title
        }
        if (!data.twitter.description && mergedData.og?.description) {
          data.twitter.description = mergedData.og.description
        }
        if (!data.twitter.image && mergedData.og?.image) {
          data.twitter.image = mergedData.og.image
        }

        return data
      } catch (error) {
        req.payload.logger.error(`SEO beforeChange hook error: ${error}`)
        return data
      }
    }

/**
 * Extract plain text from Lexical JSON content
 */
function extractTextFromLexical(content: unknown): string {
  if (!content) return ''

  let text = ''

  function traverse(node: unknown): void {
    if (!node) return

    if (typeof node === 'string') {
      text += node + ' '
      return
    }

    if (typeof node === 'object' && node !== null) {
      const obj = node as Record<string, unknown>

      if (obj.text && typeof obj.text === 'string') {
        text += obj.text + ' '
      }

      if (obj.children && Array.isArray(obj.children)) {
        obj.children.forEach(traverse)
      }

      if (obj.root) {
        traverse(obj.root)
      }
    }
  }

  traverse(content)

  return text.trim().replace(/\s+/g, ' ')
}
