import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { analyzeKeywordChecks } from '@/plugins/seo/utils/seoAnalyzer'

// Input bounds (L2-07): cap the request so a compromised/over-eager client
// cannot force expensive recursive extraction or stemming.
const MAX_BODY_BYTES = 1_000_000 // ~1 MB JSON payload
const MAX_KEYWORD_CHARS = 200
const MAX_CONTENT_CHARS = 500_000 // serialized content tree

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const requestHeaders = await headers()

    // Authenticate request (admin only) — same pattern as /api/seo/indexing.
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Reject oversized bodies before parsing when the client declares a size.
    const declaredLength = Number(requestHeaders.get('content-length') || 0)
    if (declaredLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    const { keyword, title, meta, slug, content, locale } = await req.json()

    if (!keyword || typeof keyword !== 'string' || !keyword.trim()) {
      return NextResponse.json({ error: 'Missing keyword' }, { status: 400 })
    }

    if (keyword.length > MAX_KEYWORD_CHARS) {
      return NextResponse.json({ error: 'Keyword too long' }, { status: 400 })
    }

    if (content != null && JSON.stringify(content).length > MAX_CONTENT_CHARS) {
      return NextResponse.json({ error: 'Content too large' }, { status: 400 })
    }

    const result = analyzeKeywordChecks({
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
