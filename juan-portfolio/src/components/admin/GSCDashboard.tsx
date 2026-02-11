'use client'
import React, { useEffect, useState } from 'react'
import { useConfig } from '@payloadcms/ui'

interface GSCAggregate {
  clicks: number
  impressions: number
  avgPosition: number
}

export const GSCDashboard: React.FC = () => {
  const [stats, setStats] = useState<GSCAggregate | null>(null)
  const [topPages, setTopPages] = useState<any[]>([])
  const [topQueries, setTopQueries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { config } = useConfig()
  const serverURL = config.serverURL

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Fetch all metrics to aggregate
        // In a real app, you might want a specialized endpoint for this
        const response = await fetch(`${serverURL}/api/gsc-metrics?limit=1000&sort=-date`)
        const json = await response.json()
        const docs = json.docs || []

        if (docs.length > 0) {
          const totalClicks = docs.reduce((acc: number, row: any) => acc + row.clicks, 0)
          const totalImpressions = docs.reduce((acc: number, row: any) => acc + row.impressions, 0)
          const avgPos = docs.reduce((acc: number, row: any) => acc + row.position, 0) / docs.length

          setStats({ clicks: totalClicks, impressions: totalImpressions, avgPosition: avgPos })

          // Simple "Analysis" - Group by page
          const pageMap = new Map()
          docs.forEach((row: any) => {
            const current = pageMap.get(row.page) || { clicks: 0, impressions: 0 }
            pageMap.set(row.page, {
              clicks: current.clicks + row.clicks,
              impressions: current.impressions + row.impressions,
            })
          })
          const sortedPages = Array.from(pageMap.entries())
            .map(([page, metrics]) => ({ page, ...metrics }))
            .sort((a, b) => b.clicks - a.clicks)
          setTopPages(sortedPages.slice(0, 10))

          // Group by query
          const queryMap = new Map()
          docs.forEach((row: any) => {
            const current = queryMap.get(row.query) || { clicks: 0, impressions: 0 }
            queryMap.set(row.query, {
              clicks: current.clicks + row.clicks,
              impressions: current.impressions + row.impressions,
            })
          })
          const sortedQueries = Array.from(queryMap.entries())
            .map(([query, metrics]) => ({ query, ...metrics }))
            .sort((a, b) => b.clicks - a.clicks)
          setTopQueries(sortedQueries.slice(0, 10))
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [serverURL])

  if (loading) return <div style={{ padding: '20px' }}>Loading Global GSC Dashboard...</div>

  return (
    <div style={{ padding: '20px' }}>
      <h1>Google Search Console Global Dashboard</h1>
      <p>Aggregated data from the last synced entries.</p>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
          <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <strong>Total Clicks</strong>
            <div style={{ fontSize: '32px', color: '#2563eb' }}>{stats.clicks}</div>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <strong>Total Impressions</strong>
            <div style={{ fontSize: '32px', color: '#2563eb' }}>{stats.impressions}</div>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <strong>Avg. Position</strong>
            <div style={{ fontSize: '32px', color: '#2563eb' }}>{stats.avgPosition.toFixed(1)}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        <div>
          <h3>Top 10 Pages by Clicks</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Page</th>
                <th style={{ padding: '10px' }}>Clicks</th>
              </tr>
            </thead>
            <tbody>
              {topPages.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', fontSize: '12px' }}>{row.page}</td>
                  <td style={{ padding: '10px' }}>{row.clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3>Top 10 Queries by Clicks</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Query</th>
                <th style={{ padding: '10px' }}>Clicks</th>
              </tr>
            </thead>
            <tbody>
              {topQueries.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{row.query}</td>
                  <td style={{ padding: '10px' }}>{row.clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
