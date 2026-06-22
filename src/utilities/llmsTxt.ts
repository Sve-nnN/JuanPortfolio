/**
 * Pure builder for /llms.txt, extracted from the route so it is unit-testable
 * and resilient to bad CMS data.
 *
 * Regression context (SEO audit jun-2026, issue #21): the `summary` field of the
 * Payload `llm` global was populated with the entire context document (starting
 * with its own `# Juan Tech...` heading), and `fullContent` repeated the same
 * block. The old route emitted `# ${summary}` + `## Information\n${fullContent}`,
 * producing (a) a malformed `# # Juan Tech...` H1 and (b) the whole identity
 * block twice. This builder normalizes the H1 to a single clean line and emits
 * the body once.
 */

export interface LlmResource {
  title?: string | null
  url?: string | null
  description?: string | null
}

export interface LlmPost {
  title?: string | null
  slug?: string | null
  categories?: unknown
  meta?: { description?: string | null } | null
}

export interface BuildLlmsTxtArgs {
  summary?: string | null
  fullContent?: string | null
  resources?: LlmResource[] | null
  posts?: LlmPost[]
  siteUrl: string
}

const DEFAULT_TITLE = 'Juan Tech Portfolio & Blog'

/** First non-empty line, with any leading markdown heading hashes stripped. */
export function cleanLlmTitle(summary?: string | null): string {
  if (!summary) return DEFAULT_TITLE
  const firstLine = summary.split('\n').find((l) => l.trim().length) || ''
  return firstLine.replace(/^#+\s*/, '').trim() || DEFAULT_TITLE
}

function resolveCategory(post: LlmPost): { title: string; slug: string } {
  const first = Array.isArray(post.categories) ? post.categories[0] : undefined
  if (first && typeof first === 'object') {
    const obj = first as Record<string, unknown>
    return {
      title: typeof obj.title === 'string' ? obj.title : 'General',
      slug: typeof obj.slug === 'string' ? obj.slug : 'general',
    }
  }
  return { title: 'General', slug: 'general' }
}

export function buildLlmsTxt({
  summary,
  fullContent,
  resources,
  posts = [],
  siteUrl,
}: BuildLlmsTxtArgs): string {
  const title = cleanLlmTitle(summary)

  // Body comes from fullContent; if that's empty fall back to whatever follows
  // the first line of summary so we never lose the descriptive content.
  let body = ''
  if (fullContent && fullContent.trim()) {
    body = fullContent.trim()
  } else if (summary) {
    body = summary.split('\n').slice(1).join('\n').trim()
  }

  // Drop a leading H1 in the body that just repeats the title (the source of the
  // duplicated identity block).
  const bodyLines = body.split('\n')
  if (bodyLines[0] && bodyLines[0].replace(/^#+\s*/, '').trim() === title) {
    body = bodyLines.slice(1).join('\n').trim()
  }

  let text = `# ${title}\n\n`

  if (body) {
    text += `## Information\n${body}\n\n`
  }

  if (resources && resources.length > 0) {
    text += `## Key Resources\n`
    for (const resource of resources) {
      if (!resource?.title || !resource?.url) continue
      text += `- [${resource.title}](${resource.url})${
        resource.description ? `: ${resource.description}` : ''
      }\n`
    }
    text += `\n`
  }

  if (posts.length > 0) {
    text += `## Entity Knowledge Graph (Recent Insights)\n`
    for (const post of posts) {
      const { title: categoryTitle, slug: categorySlug } = resolveCategory(post)
      text += `### ${post.title}\n`
      text += `- **URL**: ${siteUrl}/blog/${categorySlug}/${post.slug}\n`
      text += `- **Category**: ${categoryTitle}\n`
      if (post.meta?.description) {
        text += `- **Summary**: ${post.meta.description}\n`
      }
      text += `\n`
    }
  }

  return text
}
