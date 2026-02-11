import { getPayload } from 'payload'
import config from '@/payload.config'
import { unstable_cache } from 'next/cache'

const getLLMText = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const SITE_URL =
      process.env.NEXT_PUBLIC_SERVER_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      'https://juan-tech.com'

    try {
      // @ts-ignore
      const llmConfig = (await payload.findGlobal({
        slug: 'llm',
        depth: 0,
      })) as any

      let text = `# ${llmConfig.summary || 'Juan Tech Portfolio & Blog'}\n\n`

      if (llmConfig.fullContent) {
        text += `## Information\n${llmConfig.fullContent}\n\n`
      }

      if (llmConfig.resources && llmConfig.resources.length > 0) {
        text += `## Key Resources\n`
        llmConfig.resources.forEach((resource: any) => {
          text += `- [${resource.title}](${resource.url})${
            resource.description ? `: ${resource.description}` : ''
          }\n`
        })
        text += `\n`
      }

      // Add automatic links to recent posts/projects for LLM discovery
      const posts = await payload.find({
        collection: 'posts',
        limit: 10,
        depth: 1,
        where: {
          _status: { equals: 'published' },
        },
        select: {
          title: true,
          slug: true,
          categories: true,
        },
      })

      if (posts.docs.length > 0) {
        text += `## Recent Blog Posts\n`
        posts.docs.forEach((post: any) => {
          const categorySlug = post.categories?.[0]?.slug || 'general'
          text += `- [${post.title}](${SITE_URL}/blog/${categorySlug}/${post.slug})\n`
        })
        text += `\n`
      }

      return text
    } catch (error) {
      console.error('Error generating llms.txt:', error)
      return 'Juan Tech Portfolio - LLM Information Not Available'
    }
  },
  ['llms-txt'],
  {
    tags: ['llms-txt', 'global_llm', 'posts'],
    revalidate: 3600, // Cache for 1 hour
  },
)

export async function GET() {
  const text = await getLLMText()
  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59',
    },
  })
}
