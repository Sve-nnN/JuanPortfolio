import { getServerSideURL } from '@/utilities/getURL'
import { getCachedGlobal } from '@/utilities/getGlobals'

// Branded robots.txt (Nike-style ASCII banner) served as a Route Handler.
// A MetadataRoute.Robots object cannot carry leading comments, so this
// replaces the former src/app/robots.ts to allow the ASCII-art header.
// Content (banner, message, disallow list) is editable in Payload → SEO →
// Robots.txt. Sitemaps are derived here and intentionally not editable.

const FALLBACK_DISALLOW = ['/admin', '/api/']

// Prefix every line of a block with "# " so it becomes a robots.txt comment.
function toComment(block: string): string {
  return block
    .split('\n')
    .map((line) => (line.length ? `# ${line}` : '#'))
    .join('\n')
}

export async function GET(): Promise<Response> {
  const url: string = getServerSideURL()

  let asciiArt = ''
  let message = ''
  let disallow: string[] = FALLBACK_DISALLOW

  try {
    const robots = (await getCachedGlobal('robots', 0)()) as {
      asciiArt?: string | null
      message?: string | null
      disallow?: { path?: string | null }[] | null
    }
    asciiArt = robots?.asciiArt?.trim() ? robots.asciiArt : ''
    message = robots?.message?.trim() ? robots.message : ''
    const paths = (robots?.disallow ?? [])
      .map((d) => d?.path?.trim())
      .filter((p): p is string => Boolean(p))
    if (paths.length) disallow = paths
  } catch {
    // Global not seeded yet (e.g. first boot): fall back to defaults so
    // /robots.txt never 500s or serves an empty file.
  }

  const header = [asciiArt, message]
    .filter((block) => block.trim().length)
    .map(toComment)
    .join('\n#\n')

  const lines: string[] = []
  if (header) lines.push(header, '')
  lines.push('User-agent: *', 'Allow: /')
  for (const path of disallow) lines.push(`Disallow: ${path}`)
  lines.push('')
  for (const sitemap of [
    'sitemap.xml',
    'pages-sitemap.xml',
    'posts-sitemap.xml',
    'categories-sitemap.xml',
    'authors-sitemap.xml',
  ]) {
    lines.push(`Sitemap: ${url}/${sitemap}`)
  }

  return new Response(lines.join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59',
    },
  })
}
