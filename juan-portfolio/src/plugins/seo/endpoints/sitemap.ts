import type { PayloadHandler } from 'payload'

interface SitemapConfig {
  collections: string[]
  site: {
    name: string
    url: string
  }
}

interface SitemapEntry {
  url: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export const generateSitemap = ({ collections, site }: SitemapConfig): PayloadHandler => {
  return async (req, res) => {
    try {
      const { payload } = req

      const entries: SitemapEntry[] = []

      // Add homepage
      entries.push({
        url: site.url,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString(),
      })

      // Get SEO settings to check excluded pages
      const seoSettings = await payload.findGlobal({
        slug: 'seo-settings',
      })

      const excludedSlugs =
        seoSettings?.excludeFromSitemap?.map((item: { slug: string }) => item.slug) || []

      // Fetch all documents from specified collections
      for (const collectionSlug of collections) {
        try {
          const collection = payload.collections[collectionSlug]
          if (!collection) continue

          const docs = await payload.find({
            collection: collectionSlug,
            limit: 1000,
            where: {
              _status: {
                equals: 'published',
              },
            },
          })

          docs.docs.forEach((doc) => {
            // Skip if noindex is enabled
            if (doc.meta?.noindex) return

            // Skip if in excluded list
            if (doc.slug && excludedSlugs.includes(doc.slug)) return

            // Determine URL based on collection
            let url = ''
            if (collectionSlug === 'pages') {
              if (doc.slug === 'home') {
                url = site.url
              } else {
                url = `${site.url}/${doc.slug}`
              }
            } else if (collectionSlug === 'posts') {
              url = `${site.url}/blog/${doc.slug}`
            } else if (collectionSlug === 'case-studies') {
              url = `${site.url}/case-studies/${doc.slug}`
            } else {
              url = `${site.url}/${collectionSlug}/${doc.slug}`
            }

            // Determine priority based on collection and content
            let priority = 0.5
            if (collectionSlug === 'pages') {
              priority = doc.slug === 'home' ? 1.0 : 0.8
            } else if (collectionSlug === 'posts' || collectionSlug === 'case-studies') {
              priority = 0.7
            }

            // Determine change frequency
            let changefreq: SitemapEntry['changefreq'] = 'monthly'
            if (collectionSlug === 'pages') {
              changefreq = doc.slug === 'home' ? 'daily' : 'weekly'
            } else if (collectionSlug === 'posts' || collectionSlug === 'case-studies') {
              changefreq = 'monthly'
            }

            entries.push({
              url,
              lastmod: doc.updatedAt || doc.createdAt || new Date().toISOString(),
              changefreq,
              priority,
            })
          })
        } catch (error) {
          payload.logger.error(`Error fetching collection ${collectionSlug}: ${error}`)
        }
      }

      // Generate XML
      const xml = generateSitemapXML(entries)

      // Set headers
      res.setHeader('Content-Type', 'application/xml; charset=utf-8')
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=7200')

      // Update last regeneration time
      try {
        await payload.globals.update({
          slug: 'seo-settings',
          data: {
            sitemapNeedsRegeneration: false,
            sitemapLastGenerated: new Date().toISOString(),
          },
        })
      } catch (error) {
        payload.logger.error(`Error updating SEO settings: ${error}`)
      }

      res.status(200).send(xml)
    } catch (error) {
      req.payload.logger.error(`Sitemap generation error: ${error}`)
      res.status(500).send('Error generating sitemap')
    }
  }
}

/**
 * Generate sitemap XML from entries
 */
function generateSitemapXML(entries: SitemapEntry[]): string {
  const urlsets = entries
    .map((entry) => {
      const lastmod = entry.lastmod
        ? `<lastmod>${new Date(entry.lastmod).toISOString().split('T')[0]}</lastmod>`
        : ''
      const changefreq = entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ''
      const priority =
        entry.priority !== undefined ? `<priority>${entry.priority.toFixed(1)}</priority>` : ''

      return `  <url>
    <loc>${escapeXML(entry.url)}</loc>${lastmod}${changefreq}${priority}
  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urlsets}
</urlset>`
}

/**
 * Escape XML special characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
