import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../../payload.config'
import { GSCAdapter } from './adapters/GSCAdapter'

async function syncGSC() {
  console.log('⏳ Initializing GSC Sync...')
  const payload = await getPayload({ config })
  const adapter = new GSCAdapter()

  // GSC data usually has a 3-day delay. We'll fetch data for the last 7 days to ensure coverage.
  const today = new Date()
  const endDate = new Date(today)
  endDate.setDate(today.getDate() - 3) // 3 days ago
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 10) // 10 days ago (to overlap and ensure no missing data)

  const startDateStr = startDate.toISOString().split('T')[0]
  const endDateStr = endDate.toISOString().split('T')[0]

  console.log(`🔍 Fetching GSC data from ${startDateStr} to ${endDateStr}...`)

  const rows = await adapter.fetchPerformance(startDateStr, endDateStr)

  console.log(`✅ Fetched ${rows.length} rows from GSC. Syncing to Payload...`)

  // Get unique pages to inspect indexing status (limit to 50 per run to respect quota)
  const uniquePages = [...new Set(rows.map(r => r.page))].slice(0, 50)
  const indexStatusMap = new Map<string, string>()

  console.log(`🔍 Inspecting ${uniquePages.length} unique pages for indexing status...`)
  for (const page of uniquePages) {
    const inspection = await adapter.inspectUrl(page)
    const status = inspection?.indexStatusResult?.verdict === 'VERDICT_UNSPECIFIED' ? 'UNKNOWN' : 
                   inspection?.indexStatusResult?.verdict === 'PASS' ? 'INDEXED' : 'NOT_INDEXED'
    indexStatusMap.set(page, status)
    // Small delay to be safe
    await new Promise(r => setTimeout(r, 200))
  }

  let updated = 0
  let created = 0

  for (const row of rows) {
    // Check if this specific row already exists
    const existing = await payload.find({
      collection: 'gsc-metrics',
      where: {
        and: [
          { date: { equals: row.date } },
          { page: { equals: row.page } },
          { query: { equals: row.query } },
          { country: { equals: row.country } },
          { device: { equals: row.device } },
        ],
      },
      limit: 1,
    })

    const data: any = {
      date: row.date,
      page: row.page,
      query: row.query,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      country: row.country,
      device: row.device,
      indexStatus: indexStatusMap.get(row.page) || 'UNKNOWN',
      lastInspected: indexStatusMap.has(row.page) ? new Date().toISOString() : undefined,
    }

    if (existing.totalDocs > 0) {
      // Update if metrics changed (though GSC historical data is usually static after finalized)
      const doc = existing.docs[0]
      if (doc.clicks !== row.clicks || doc.impressions !== row.impressions || doc.position !== row.position) {
        await payload.update({
          collection: 'gsc-metrics',
          id: doc.id,
          data,
        })
        updated++
      }
    } else {
      await payload.create({
        collection: 'gsc-metrics',
        data,
      })
      created++
    }
  }

  console.log(`✨ GSC Sync Complete! Created: ${created}, Updated: ${updated}`)
  process.exit(0)
}

syncGSC().catch((err) => {
  console.error('❌ GSC Sync Failed:', err)
  process.exit(1)
})
