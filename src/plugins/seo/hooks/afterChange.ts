import type { CollectionAfterChangeHook } from 'payload'

interface AfterChangeConfig {
  sitemap?: boolean
  sitemapPath?: string
}

export const afterChangeHook =
  ({
    sitemap: _sitemap = true,
    sitemapPath: _sitemapPath = '/sitemap.xml',
  }: AfterChangeConfig = {}) =>
  async ({ doc, req: _req, operation: _operation }: Parameters<CollectionAfterChangeHook>[0]) => {
    try {
      // Sitemap is generated on-demand, no need to update global here
      // The /sitemap.xml endpoint will always generate fresh data
      return doc
    } catch (_error) {
      // Silently fail, return doc
      return doc
    }
  }
