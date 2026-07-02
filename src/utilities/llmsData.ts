import { getPayload } from 'payload'
import config from '@/payload.config'
import { unstable_cache } from 'next/cache'
import type { Llm } from '@/payload-types'
import { buildLlmsTxt } from '@/utilities/llmsTxt'

/**
 * Resilient data source for /llms.txt and /llms-full.txt.
 *
 * Previously the route wrapped BOTH the `llm` global and the posts query in one
 * try/catch and, on any failure, returned the literal string
 * "Juan Tech Portfolio - LLM Information Not Available". In production that
 * catch fired (Payload cold-start / DB timeout on Vercel), so /llms.txt served
 * an error line instead of Markdown. Now each query fails independently and we
 * always run the builder, which degrades to a minimal-but-valid Markdown
 * document even when everything is unavailable. Issue #93.
 */
async function fetchLlmsText(): Promise<string> {
  const SITE_URL =
    process.env.NEXT_PUBLIC_SERVER_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    'https://juan-tech.com'

  let llmConfig: Partial<Llm> = {}
  try {
    const payload = await getPayload({ config })
    llmConfig = (await payload.findGlobal({ slug: 'llm', depth: 0 })) as Llm
  } catch (error) {
    console.error('llms.txt: failed to load `llm` global:', error)
  }

  let posts: Array<Record<string, unknown>> = []
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'posts',
      limit: 10,
      depth: 1,
      where: { _status: { equals: 'published' } },
      select: { title: true, slug: true, categories: true, meta: true },
    })
    posts = res.docs
  } catch (error) {
    console.error('llms.txt: failed to load posts:', error)
  }

  // buildLlmsTxt tolerates empty/missing fields and still emits a valid document
  // (at minimum a clean H1), so we never fall back to a bare error string.
  return buildLlmsTxt({
    summary: llmConfig.summary,
    fullContent: llmConfig.fullContent,
    resources: llmConfig.resources,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    posts: posts as any,
    siteUrl: SITE_URL,
  })
}

/** Cached llms.txt text. Revalidated hourly and on `global_llm`/`posts` tag bumps. */
export const getLlmsText = unstable_cache(fetchLlmsText, ['llms-txt'], {
  tags: ['llms-txt', 'global_llm', 'posts'],
  revalidate: 3600,
})
