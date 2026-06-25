import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { analyzeKeywordChecks } from '@/plugins/seo/utils/seoAnalyzer'

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const requestHeaders = await headers()

    // Authenticate request (admin only) — same pattern as /api/seo/indexing.
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { keyword, title, meta, slug, content, locale } = await req.json()

    if (!keyword || typeof keyword !== 'string' || !keyword.trim()) {
      return NextResponse.json({ error: 'Missing keyword' }, { status: 400 })
    }

    const result = await analyzeKeywordChecks({
      keyword,
      title,
      meta,
      slug,
      content,
      locale: locale === 'es' ? 'es' : 'en',
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    // Do not leak internals to the client.
    console.error('API Error in /api/seo/keyword-score:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
