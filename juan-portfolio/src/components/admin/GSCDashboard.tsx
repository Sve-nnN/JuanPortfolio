'use client'
import React, { useEffect, useState, useMemo } from 'react'
import { useConfig } from '@payloadcms/ui'
import { GSCChart } from './GSCChart'
import { GSCAnalysis } from './GSCAnalysis'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type Timeframe = '28d' | '3m' | '6m' | '12m'
type Tab = 'performance' | 'indexing' | 'experience' | 'links'

interface GSCDataRow {
  date: string
  page: string
  clicks: number
  impressions: number
  position: number
  indexStatus: string
  indexingIssue?: string
  query: string
}

interface PageMetricRow {
  path?: string
  url: string
  mobile?: {
    score: number
    lcp: number
    cls: number
  }
}

interface BrokenLinkRow {
  url: string
  sourcePage: string
  statusCode: number
  statusText: string
}

const BRAND_TERMS = ['juan', 'juantech', 'juan portfolio', 'juan portfolio tech']

export const GSCDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('performance')
  const [timeframe, setTimeframe] = useState<Timeframe>('28d')
  const [gscData, setGscData] = useState<GSCDataRow[]>([])
  const [pageMetrics, setPageMetrics] = useState<PageMetricRow[]>([])
  const [brokenLinks, setBrokenLinks] = useState<BrokenLinkRow[]>([])
  const [loading, setLoading] = useState(true)
  const { config } = useConfig()
  const serverURL = config.serverURL

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        const [gscRes, pageRes, brokenRes] = await Promise.all([
          fetch(`${serverURL}/api/gsc-metrics?limit=5000&sort=-date`),
          fetch(`${serverURL}/api/page-metrics?limit=100`),
          fetch(`${serverURL}/api/broken-links?limit=100`)
        ])

        if (!isMounted) return

        const [gscJson, pageJson, brokenJson] = await Promise.all([
          gscRes.json(),
          pageRes.json(),
          brokenRes.json()
        ])

        setGscData((gscJson.docs || []) as GSCDataRow[])
        setPageMetrics((pageJson.docs || []) as PageMetricRow[])
        setBrokenLinks((brokenJson.docs || []) as BrokenLinkRow[])
      } catch (error) {
        console.error('[SEO Intelligence Audit Error]:', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchData()
    return () => { isMounted = false }
  }, [timeframe, serverURL])

  // --- LÓGICA DE PROCESAMIENTO OPTIMIZADA ---

  const pagesSummary = useMemo(() => {
    const map = new Map<string, { clicks: number, imps: number, pos: number, count: number, status: string, issue?: string }>()
    for (const r of gscData) {
      const current = map.get(r.page) || { clicks: 0, imps: 0, pos: 0, count: 0, status: r.indexStatus, issue: r.indexingIssue }
      map.set(r.page, {
        clicks: current.clicks + r.clicks,
        imps: current.imps + r.impressions,
        pos: current.pos + r.position,
        count: current.count + 1,
        status: r.indexStatus,
        issue: r.indexingIssue
      })
    }
    return Array.from(map.entries()).map(([url, data]) => ({
      url,
      path: url.replace(/https?:\/\/[^\/]+/, '') || '/',
      clicks: data.clicks,
      imps: data.imps,
      avgPos: data.pos / (data.count || 1),
      status: data.status,
      issue: data.issue
    }))
  }, [gscData])

  const ctrByPositionData = useMemo(() => {
    if (gscData.length === 0) return []
    const posMap = new Map<number, { sumCtr: number, count: number }>()
    
    for (const row of gscData) {
      if (BRAND_TERMS.some(term => row.query?.toLowerCase().includes(term))) continue
      
      const pos = Math.round(row.position)
      if (pos > 10 || pos < 1) continue
      
      const ctr = row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0
      const ex = posMap.get(pos) || { sumCtr: 0, count: 0 }
      posMap.set(pos, { sumCtr: ex.sumCtr + ctr, count: ex.count + 1 })
    }
    
    return Array.from(posMap.entries())
      .map(([pos, d]) => ({ pos, ctr: Number((d.sumCtr / (d.count || 1)).toFixed(2)) }))
      .sort((a, b) => a.pos - b.pos)
  }, [gscData])

  const stats = useMemo(() => {
    if (gscData.length === 0) return null
    let totalClicks = 0, totalImps = 0, totalPos = 0
    for (const r of gscData) {
      totalClicks += r.clicks
      totalImps += r.impressions
      totalPos += r.position
    }
    return { 
      clicks: totalClicks, 
      imps: totalImps, 
      pos: totalPos / (gscData.length || 1), 
      ctr: totalImps > 0 ? (totalClicks / totalImps) * 100 : 0 
    }
  }, [gscData])

  const trendData = useMemo(() => {
    const dMap = new Map<string, { date: string, clicks: number, impressions: number }>()
    for (const r of gscData) {
      const d = r.date.split('T')[0]
      const cur = dMap.get(d) || { date: d, clicks: 0, impressions: 0 }
      dMap.set(d, { date: d, clicks: cur.clicks + r.clicks, impressions: cur.impressions + r.impressions })
    }
    return Array.from(dMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [gscData])

  if (loading) return <div style={{ padding: '40px', color: '#6B7280' }}>Sincronizando auditoría SEO...</div>

  return (
    <div style={{ padding: '40px', maxWidth: '1440px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Centro de Inteligencia SEO</h1>
          <p style={{ color: '#6B7280', fontSize: '14px' }}>Análisis técnico de rendimiento y arquitectura de búsqueda</p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', backgroundColor: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '8px' }}>
          {(['28d', '3m', '6m', '12m'] as Timeframe[]).map((tf) => (
            <button key={tf} onClick={() => setTimeframe(tf)} style={{
              padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              backgroundColor: timeframe === tf ? 'var(--theme-bg)' : 'transparent',
              color: timeframe === tf ? '#2563EB' : '#4B5563',
              boxShadow: timeframe === tf ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}>
              {tf === '12m' ? '1 AÑO' : tf.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <nav style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--theme-border-color)', marginBottom: '32px' }}>
        {[
          { id: 'performance', label: 'Rendimiento' },
          { id: 'indexing', label: 'Estado de Indexación' },
          { id: 'experience', label: 'Calidad de Experiencia' },
          { id: 'links', label: 'Análisis de Enlaces' },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} style={{
            padding: '12px 0', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px',
            fontWeight: activeTab === tab.id ? 600 : 500,
            color: activeTab === tab.id ? '#2563EB' : '#6B7280',
            borderBottom: activeTab === tab.id ? '2px solid #2563EB' : '2px solid transparent',
            marginBottom: '-1px'
          }}>
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'performance' && (
        <section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
            <MetricCard label="Clicks Totales" value={stats?.clicks?.toLocaleString() || '0'} color="#2563EB" />
            <MetricCard label="Impresiones" value={stats?.imps?.toLocaleString() || '0'} color="#7C3AED" />
            <MetricCard label="CTR Medio" value={stats?.ctr ? `${stats.ctr.toFixed(2)}%` : '0.00%'} color="#D97706" />
            <MetricCard label="Posición Media" value={stats?.pos?.toFixed(1) || '0.0'} color="#059669" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--theme-border-color)' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '20px', textTransform: 'uppercase' }}>Tendencia de Tráfico</h3>
              <GSCChart data={trendData} height={250} />
            </div>
            <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--theme-border-color)' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '20px', textTransform: 'uppercase' }}>Curva de CTR por Posición</h3>
              <div style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ctrByPositionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--theme-border-color)" />
                    <XAxis dataKey="pos" tick={{ fontSize: 11 }} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border-color)', fontSize: '12px' }} />
                    <Bar dataKey="ctr" radius={[4, 4, 0, 0]}>
                      {ctrByPositionData.map((e, i) => <Cell key={i} fill={e.ctr > 10 ? '#2563EB' : '#94A3B8'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <GSCAnalysis />
        </section>
      )}

      {activeTab === 'indexing' && (
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          <div style={{ padding: '32px', borderRadius: '12px', border: '1px solid var(--theme-border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#DC2626', marginBottom: '24px' }}>Conflictos de Cobertura Detectados</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: '#6B7280' }}>
                  <th style={{ paddingBottom: '12px' }}>Ruta del Recurso</th>
                  <th style={{ paddingBottom: '12px' }}>Estado Técnico</th>
                </tr>
              </thead>
              <tbody>
                {pagesSummary.filter(p => p.status === 'NOT_INDEXED').map((p, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--theme-border-color)' }}>
                    <td style={{ padding: '14px 0', fontSize: '13px' }}>{p.path}</td>
                    <td style={{ padding: '14px 0', fontSize: '12px', color: '#DC2626' }}>{p.issue || 'No indexada'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '32px', borderRadius: '12px', border: '1px solid var(--theme-border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#059669', marginBottom: '24px' }}>Indexación Confirmada</h3>
            <p style={{ fontSize: '14px', color: '#4B5563' }}>Google ha indexado correctamente <strong>{pagesSummary.filter(p => p.status === 'INDEXED').length}</strong> rutas.</p>
          </div>
        </section>
      )}

      {activeTab === 'experience' && (
        <section style={{ padding: '32px', borderRadius: '12px', border: '1px solid var(--theme-border-color)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Core Web Vitals - Datos de Campo</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: '#6B7280' }}>
                <th style={{ paddingBottom: '12px' }}>Página</th>
                <th style={{ paddingBottom: '12px' }}>Score</th>
                <th style={{ paddingBottom: '12px' }}>LCP</th>
                <th style={{ paddingBottom: '12px' }}>CLS</th>
                <th style={{ paddingBottom: '12px' }}>Calificación</th>
              </tr>
            </thead>
            <tbody>
              {pageMetrics.map((pm, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--theme-border-color)' }}>
                  <td style={{ padding: '14px 0', fontSize: '13px' }}>{pm.path || '/'}</td>
                  <td style={{ padding: '14px 0', fontSize: '13px', fontWeight: 600 }}>{pm.mobile?.score || '--'}</td>
                  <td style={{ padding: '14px 0', fontSize: '13px' }}>{pm.mobile?.lcp ? `${pm.mobile.lcp}s` : '--'}</td>
                  <td style={{ padding: '14px 0', fontSize: '13px' }}>{pm.mobile?.cls || '--'}</td>
                  <td style={{ padding: '14px 0' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, 
                      backgroundColor: (pm.mobile?.score || 0) > 80 ? 'rgba(5, 150, 105, 0.1)' : 'rgba(217, 119, 6, 0.1)', 
                      color: (pm.mobile?.score || 0) > 80 ? '#059669' : '#D97706' 
                    }}>
                      {(pm.mobile?.score || 0) > 80 ? 'ÓPTIMO' : 'A MEJORAR'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === 'links' && (
        <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
          <div style={{ padding: '32px', borderRadius: '12px', border: '1px solid var(--theme-border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#DC2626', marginBottom: '24px' }}>Reporte de Enlaces Rotos (404)</h3>
            {brokenLinks.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: '#6B7280' }}>
                    <th style={{ paddingBottom: '12px' }}>URL Destino</th>
                    <th style={{ paddingBottom: '12px' }}>Origen</th>
                    <th style={{ paddingBottom: '12px' }}>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {brokenLinks.map((l, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--theme-border-color)' }}>
                      <td style={{ padding: '14px 0', fontSize: '13px', color: '#DC2626' }}>{l.url}</td>
                      <td style={{ padding: '14px 0', fontSize: '12px' }}>{l.sourcePage}</td>
                      <td style={{ padding: '14px 0' }}>
                        <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', fontSize: '11px', fontWeight: 700 }}>
                          {l.statusCode} {l.statusText}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p style={{ color: '#059669', fontSize: '14px', fontWeight: 600 }}>✓ No se han detectado enlaces rotos.</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

const MetricCard: React.FC<{ label: string, value: string, color: string }> = ({ label, value, color }) => (
  <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--theme-border-color)', backgroundColor: 'transparent' }}>
    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
    <div style={{ fontSize: '28px', fontWeight: 700, color, marginTop: '8px' }}>{value}</div>
  </div>
)
