'use client'
import React, { useEffect, useState } from 'react'
import { useConfig } from '@payloadcms/ui'

interface GSCMetric {
  date: string
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export const GSCPerformanceView: React.FC<{ path?: string }> = ({ path }) => {
  const [data, setData] = useState<GSCMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [indexStatus, setIndexStatus] = useState<string>('UNKNOWN')
  const { config } = useConfig()
  const serverURL = config.serverURL

  useEffect(() => {
    const fetchData = async () => {
      if (!path) return
      
      try {
        setLoading(true)
        const gscPropertyUrl = (process.env.NEXT_PUBLIC_GSC_PROPERTY_URL || '').replace(/\/$/, '')
        const cleanPath = path.startsWith('/') ? path : `/${path}`
        const fullUrl = `${gscPropertyUrl}${cleanPath}`
        
        // Fetch metrics
        const response = await fetch(
          `${serverURL}/api/gsc-metrics?where[page][equals]=${encodeURIComponent(fullUrl)}&sort=-date&limit=100`,
        )
        const json = await response.json()
        setData(json.docs || [])

        // Get index status from the latest row if available
        if (json.docs && json.docs.length > 0) {
          setIndexStatus(json.docs[0].indexStatus || 'UNKNOWN')
        }
      } catch (error) {
        console.error('Error fetching GSC data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [path, serverURL])

  if (loading) return <div>Loading GSC data...</div>
  if (data.length === 0) return <div>No Search Console data found for this URL.</div>

  // Comparison logic: Split data into current week and previous week (approx)
  const currentPeriod = data.slice(0, Math.floor(data.length / 2))
  const previousPeriod = data.slice(Math.floor(data.length / 2))

  const calcStats = (period: GSCMetric[]) => {
    const clicks = period.reduce((acc, row) => acc + row.clicks, 0)
    const imps = period.reduce((acc, row) => acc + row.impressions, 0)
    const pos = period.reduce((acc, row) => acc + row.position, 0) / (period.length || 1)
    return { clicks, imps, pos }
  }

  const currentStats = calcStats(currentPeriod)
  const prevStats = calcStats(previousPeriod)

  const renderTrend = (current: number, prev: number, inverse = false) => {
    const diff = current - prev
    if (Math.abs(diff) < 0.1) return <span style={{ color: '#666', fontSize: '12px' }}> (0%)</span>
    const percent = ((diff / (prev || 1)) * 100).toFixed(1)
    const isGood = inverse ? diff < 0 : diff > 0
    const color = isGood ? 'var(--theme-success-500)' : 'var(--theme-error-500)'
    return <span style={{ color, fontSize: '12px', marginLeft: '5px' }}>
      {diff > 0 ? '↑' : '↓'} {Math.abs(Number(percent))}%
    </span>
  }

  const statusColors: any = {
    'INDEXED': 'var(--theme-success-500)',
    'NOT_INDEXED': 'var(--theme-error-500)',
    'UNKNOWN': '#666'
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Google Search Console Performance</h3>
        <div style={{ 
          padding: '5px 12px', 
          borderRadius: '20px', 
          fontSize: '12px', 
          backgroundColor: 'var(--theme-bg)',
          border: `1px solid ${statusColors[indexStatus] || '#ccc'}`,
          color: statusColors[indexStatus]
        }}>
          ● Index Status: {indexStatus}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
        <div style={{ padding: '15px', border: '1px solid var(--theme-border-color)', borderRadius: '4px' }}>
          <strong>Clicks</strong>
          <div style={{ fontSize: '24px' }}>
            {currentStats.clicks}
            {renderTrend(currentStats.clicks, prevStats.clicks)}
          </div>
        </div>
        <div style={{ padding: '15px', border: '1px solid var(--theme-border-color)', borderRadius: '4px' }}>
          <strong>Impressions</strong>
          <div style={{ fontSize: '24px' }}>
            {currentStats.imps}
            {renderTrend(currentStats.imps, prevStats.imps)}
          </div>
        </div>
        <div style={{ padding: '15px', border: '1px solid var(--theme-border-color)', borderRadius: '4px' }}>
          <strong>Avg. Position</strong>
          <div style={{ fontSize: '24px' }}>
            {currentStats.pos.toFixed(1)}
            {renderTrend(currentStats.pos, prevStats.pos, true)}
          </div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
            <th style={{ padding: '10px' }}>Date</th>
            <th style={{ padding: '10px' }}>Top Queries</th>
            <th style={{ padding: '10px' }}>Clicks</th>
            <th style={{ padding: '10px' }}>Impressions</th>
            <th style={{ padding: '10px' }}>Position</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 20).map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{new Date(row.date).toLocaleDateString()}</td>
              <td style={{ padding: '10px' }}>{row.query}</td>
              <td style={{ padding: '10px' }}>{row.clicks}</td>
              <td style={{ padding: '10px' }}>{row.impressions}</td>
              <td style={{ padding: '10px' }}>{row.position.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
