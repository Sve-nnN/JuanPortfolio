import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../../payload.config'
import { GSCAdapter } from './adapters/GSCAdapter'

interface GSCDataUpdate {
  date: string
  page: string
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  country: string
  device: string
  indexStatus: string
  indexingIssue?: string
  lastInspected?: string
}

interface AggregateMetrics {
  clicks: number
  impressions: number
  sumPosition: number
}

async function syncGSC() {
  console.log('⏳ Initializing GSC Sync...')
  const payload = await getPayload({ config })
  const adapter = new GSCAdapter()

  const today = new Date()
  const endDate = new Date(today)
  endDate.setDate(today.getDate() - 3)
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 10)

  const startDateStr = startDate.toISOString().split('T')[0]
  const endDateStr = endDate.toISOString().split('T')[0]

  console.log(`🔍 Fetching GSC data from ${startDateStr} to ${endDateStr}...`)

  const rows = await adapter.fetchPerformance(startDateStr, endDateStr)

  console.log(`✅ Fetched ${rows.length} rows from GSC. Syncing to Payload...`)

  const uniquePages = [...new Set(rows.map(r => r.page))].slice(0, 50)
  const indexStatusMap = new Map<string, string>()

  console.log(`🔍 Inspecting ${uniquePages.length} unique pages for indexing status...`)
  for (const page of uniquePages) {
    const inspection = await adapter.inspectUrl(page)
    const result = inspection?.indexStatusResult
    const status = result?.verdict === 'VERDICT_UNSPECIFIED' ? 'UNKNOWN' : 
                   result?.verdict === 'PASS' ? 'INDEXED' : 'NOT_INDEXED'
    
    const issue = status === 'NOT_INDEXED' ? (result?.coverageState || 'Desconocido') : undefined
    
    indexStatusMap.set(page, JSON.stringify({ status, issue }))
    await new Promise(r => setTimeout(r, 200))
  }

  let updated = 0
  let created = 0

  for (const row of rows) {
    const inspectionData = indexStatusMap.get(row.page) ? JSON.parse(indexStatusMap.get(row.page)!) : { status: 'UNKNOWN' }

    const data: GSCDataUpdate = {
      date: row.date,
      page: row.page,
      query: row.query,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      country: row.country,
      device: row.device,
      indexStatus: inspectionData.status,
      indexingIssue: inspectionData.issue,
      lastInspected: indexStatusMap.has(row.page) ? new Date().toISOString() : undefined,
    }

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

    if (existing.totalDocs > 0) {
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

  console.log('🔄 Aggregating GSC data to KeywordMetrics...')
  
  const trackedKeywords = await payload.find({
    collection: 'keyword-metrics',
    limit: 1000,
  })

  let kwUpdated = 0
  for (const kwDoc of trackedKeywords.docs) {
    const metrics = await payload.find({
      collection: 'gsc-metrics',
      where: {
        query: { equals: kwDoc.keyword },
      },
      limit: 1000,
    })

    if (metrics.totalDocs > 0) {
      const totals = metrics.docs.reduce((acc: AggregateMetrics, curr) => ({
        clicks: acc.clicks + curr.clicks,
        impressions: acc.impressions + curr.impressions,
        sumPosition: acc.sumPosition + curr.position,
      }), { clicks: 0, impressions: 0, sumPosition: 0 })

      const avgPosition = totals.sumPosition / metrics.totalDocs
      const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) : 0

      await payload.update({
        collection: 'keyword-metrics',
        id: kwDoc.id,
        data: {
          clicks: totals.clicks,
          impressions: totals.impressions,
          ctr: ctr,
          avgPosition: avgPosition,
          lastGSCUpdate: new Date().toISOString(),
        },
      })
      kwUpdated++
    }
  }

  console.log(`✅ Aggregation Complete! Updated ${kwUpdated} KeywordMetrics entries.`)
  process.exit(0)
}

syncGSC().catch((err) => {
  console.error('❌ GSC Sync Failed:', err)
  process.exit(1)
})
