import { getLlmsText } from '@/utilities/llmsData'

/**
 * /llms-full.txt — AI crawlers and the llmstxt.org convention probe this path
 * for an expanded variant. Without an explicit route it fell through to the
 * [locale] catch-all and served the homepage HTML (200 text/html), which is
 * worse than a 404 for a consumer expecting plain text. Serve the same
 * structured, resilient Markdown as /llms.txt so the path is real. Issue #94.
 */
export async function GET() {
  const text = await getLlmsText()
  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59',
    },
  })
}
