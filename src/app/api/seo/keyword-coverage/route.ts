import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { runKeywordCoverageAudit } from '@/utilities/seo/keywordCoverageAudit'

/**
 * GET /api/seo/keyword-coverage
 *
 * Authenticated (admin-only) endpoint that runs the shared coverage audit core
 * SERVER-SIDE and returns the report JSON. This is the bridge the admin custom
 * view (plan 23-02) uses so the NLP analyzer (`natural`) never ships in the
 * client bundle (threat T-23-SC). Mirrors the auth gate of
 * /api/seo/keyword-score (T-23-04 / T-23-05).
 *
 * GET — not POST: the audit is a read of current DB state with no body. Every
 * call reflects the live data (AUDIT-03: no caching/stale snapshots).
 *
 * Query params: `?locale=es|en` (default `es`).
 */
export async function GET(req: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const requestHeaders = await headers()

    // Authenticate request (admin only) — same gate as /api/seo/keyword-score.
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const localeParam = new URL(req.url).searchParams.get('locale')
    const locale: 'es' | 'en' = localeParam === 'en' ? 'en' : 'es'

    const report = await runKeywordCoverageAudit(payload, { locale })

    return NextResponse.json(report, { status: 200 })
  } catch (error) {
    // Do not leak internals to the client.
    console.error('API Error in /api/seo/keyword-coverage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
