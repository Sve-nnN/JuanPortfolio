import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { IndexingAdapter } from '@/scripts/seo/adapters/IndexingAdapter'
import { GSCAdapter } from '@/scripts/seo/adapters/GSCAdapter'

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const requestHeaders = await headers()

    // Authenticate request
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, url, collection, id } = await req.json()

    if (!url || !action) {
      return NextResponse.json(
        { error: 'Missing required parameters (url, action)' },
        { status: 400 },
      )
    }

    if (action === 'status') {
      const gsc = new GSCAdapter()
      const status = await gsc.inspectUrl(url)

      if (collection && id && status?.indexStatusResult?.coverageState) {
        try {
          await payload.update({
            collection: collection as Parameters<typeof payload.update>[0]['collection'],
            id: id,
            data: {
              indexStatus: status.indexStatusResult.coverageState,
            },
          })
        } catch (e) {
          console.error('Error updating document with indexing status', e)
        }
      }

      return NextResponse.json({ success: true, status })
    }

    if (action === 'request') {
      const adapter = new IndexingAdapter()

      const [googleResult, bingResult] = await Promise.all([
        adapter.requestGoogleIndexing(url),
        adapter.requestBingIndexing(url),
      ])

      // Store indexing request timestamp
      if (collection && id && (googleResult.success || bingResult.success)) {
        try {
          // Check if collection exists and has indexing timestamp fields (will implement in payload schema later if needed, but for now just returning)
        } catch (e) {
          console.error('Error updating document with indexing request time', e)
        }
      }

      return NextResponse.json({
        success: true,
        results: {
          google: googleResult,
          bing: bingResult,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('API Error in /api/seo/indexing:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
