'use client'
import React, { useEffect, useState } from 'react'
import { useConfig } from '@payloadcms/ui'
import { GSCChart } from './GSCChart'

interface GSCMetric {
  date: string
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  indexingIssue?: string
  indexStatus?: string
}

interface ChartRow {
  date: string
  clicks: number
  impressions: number
}

export const GSCPerformanceView: React.FC<{ path?: string }> = ({ path }) => {
  const [data, setData] = useState<GSCMetric[]>([])
  const [chartData, setChartData] = useState<ChartRow[]>([])
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
          `${serverURL}/api/gsc-metrics?where[page][equals]=${encodeURIComponent(fullUrl)}&sort=-date&limit=500`,
        )
        const json = await response.json()
        const docs = (json.docs || []) as GSCMetric[]
        setData(docs)

        // Aggregate by date for chart
        const dateMap = new Map<string, ChartRow>()
        docs.forEach((row) => {
          const date = row.date.split('T')[0]
          const current = dateMap.get(date) || { date, clicks: 0, impressions: 0 }
          dateMap.set(date, {
            date,
            clicks: current.clicks + row.clicks,
            impressions: current.impressions + row.impressions,
          })
        })
        setChartData(Array.from(dateMap.values()))

        // Get index status from the latest row if available
        if (docs.length > 0) {
          setIndexStatus(docs[0].indexStatus as unknown as string || 'UNKNOWN')
        }
      } catch (error) {
        console.error('Error fetching GSC data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [path, serverURL])

  if (loading) return <div>Cargando datos de Search Console...</div>
  if (data.length === 0) return <div>No se han encontrado datos de Search Console para esta URL.</div>

  // Comparison logic
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
    const color = isGood ? '#059669' : '#dc2626'
    return <span style={{ color, fontSize: '12px', marginLeft: '5px', fontWeight: 'bold' }}>
      {diff > 0 ? '↑' : '↓'} {Math.abs(Number(percent))}%
    </span>
  }

  const statusColors: Record<string, string> = {
    'INDEXED': '#059669',
    'NOT_INDEXED': '#dc2626',
    'UNKNOWN': '#666'
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h3 style={{ margin: 0 }}>Rendimiento en Búsqueda</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {indexStatus === 'NOT_INDEXED' && (
            <div style={{ 
              padding: '6px 14px', 
              borderRadius: '20px', 
              fontSize: '12px', 
              fontWeight: 'bold',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid #dc2626',
              color: '#dc2626'
            }}>
              ⚠ Motivo: {data[0]?.indexingIssue || 'No indexada'}
            </div>
          )}
          <div style={{ 
            padding: '6px 14px', 
            borderRadius: '20px', 
            fontSize: '12px', 
            fontWeight: 'bold',
            backgroundColor: 'rgba(0,0,0,0.03)',
            border: `1px solid ${statusColors[indexStatus] || '#ccc'}`,
            color: statusColors[indexStatus]
          }}>
            ● Indexación: {indexStatus}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div style={{ padding: '20px', border: '1px solid var(--theme-border-color)', borderRadius: '10px', backgroundColor: 'var(--theme-bg)' }}>
          <span style={{ fontSize: '13px', color: '#666' }}>Clicks</span>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '5px' }}>
            {currentStats.clicks}
            {renderTrend(currentStats.clicks, prevStats.clicks)}
          </div>
        </div>
        <div style={{ padding: '20px', border: '1px solid var(--theme-border-color)', borderRadius: '10px', backgroundColor: 'var(--theme-bg)' }}>
          <span style={{ fontSize: '13px', color: '#666' }}>Impresiones</span>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '5px' }}>
            {currentStats.imps}
            {renderTrend(currentStats.imps, prevStats.imps)}
          </div>
        </div>
        <div style={{ padding: '20px', border: '1px solid var(--theme-border-color)', borderRadius: '10px', backgroundColor: 'var(--theme-bg)' }}>
          <span style={{ fontSize: '13px', color: '#666' }}>Posición Media</span>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '5px' }}>
            {currentStats.pos.toFixed(1)}
            {renderTrend(currentStats.pos, prevStats.pos, true)}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h4 style={{ marginBottom: '15px' }}>Evolución</h4>
        <GSCChart data={chartData} height={250} />
      </div>

      <h4 style={{ marginBottom: '15px' }}>Consultas Principales</h4>
      <div style={{ backgroundColor: 'var(--theme-bg)', borderRadius: '8px', border: '1px solid var(--theme-border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(0,0,0,0.02)', textAlign: 'left', borderBottom: '1px solid var(--theme-border-color)' }}>
              <th style={{ padding: '12px 15px', fontSize: '13px' }}>Fecha</th>
              <th style={{ padding: '12px 15px', fontSize: '13px' }}>Query</th>
              <th style={{ padding: '12px 15px', fontSize: '13px', textAlign: 'right' }}>Clicks</th>
              <th style={{ padding: '12px 15px', fontSize: '13px', textAlign: 'right' }}>Impresiones</th>
              <th style={{ padding: '12px 15px', fontSize: '13px', textAlign: 'right' }}>Posición</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 20).map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--theme-border-color)' }}>
                <td style={{ padding: '10px 15px', fontSize: '12px', color: '#666' }}>{new Date(row.date).toLocaleDateString()}</td>
                <td style={{ padding: '10px 15px', fontSize: '13px', fontWeight: 'medium' }}>{row.query}</td>
                <td style={{ padding: '10px 15px', textAlign: 'right' }}>{row.clicks}</td>
                <td style={{ padding: '10px 15px', textAlign: 'right' }}>{row.impressions}</td>
                <td style={{ padding: '10px 15px', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>{row.position.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

