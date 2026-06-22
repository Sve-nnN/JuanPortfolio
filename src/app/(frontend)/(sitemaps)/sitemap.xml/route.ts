import { getServerSideSitemapIndex } from 'next-sitemap'
import { getChildSitemapUrls } from '@/utilities/sitemap'

/**
 * Master sitemap index served at /sitemap.xml — advertised in robots.txt and
 * submitted to Google Search Console. It references the real child sitemaps.
 *
 * Regression context (SEO audit jun-2026, issue #13): a stale next-sitemap
 * artifact in /public served a <urlset> containing only /robots.txt, so GSC
 * reported "1 indexed URL" and never discovered the ~132 real URLs.
 */
export async function GET(): Promise<Response> {
  return getServerSideSitemapIndex(getChildSitemapUrls())
}
