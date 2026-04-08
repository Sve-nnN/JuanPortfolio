import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { fetchPageMetrics, saveMetricsToPayload } from '@/scripts/seo/update-cwv'

export async function POST(req: Request) {
  try {
    const { id } = await req.json()
    const payload = await getPayload({ config })

    const metricDoc = await payload.findByID({
      collection: 'page-metrics',
      id,
    })

    if (!metricDoc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const apiKey = process.env.GOOGLE_PSI_API_KEY
    const metrics = await fetchPageMetrics(metricDoc.url, apiKey)

    await saveMetricsToPayload(metricDoc.url, metrics)

    return NextResponse.json({ success: true, metrics })
  } catch (error) {
    console.error('Manual scan error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
