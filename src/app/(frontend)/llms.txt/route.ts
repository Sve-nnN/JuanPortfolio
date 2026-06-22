import { getPayload } from 'payload'
import config from '@/payload.config'
import { unstable_cache } from 'next/cache'
import type { Llm } from '@/payload-types'
import { buildLlmsTxt } from '@/utilities/llmsTxt'

const getLLMText = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const SITE_URL =
      process.env.NEXT_PUBLIC_SERVER_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      'https://juan-tech.com'

    try {
      const llmConfig = (await payload.findGlobal({
        slug: 'llm',
        depth: 0,
      })) as Llm

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
          meta: true,
        },
      })

      return buildLlmsTxt({
        summary: llmConfig.summary,
        fullContent: llmConfig.fullContent,
        resources: llmConfig.resources,
        posts: posts.docs,
        siteUrl: SITE_URL,
      })
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
