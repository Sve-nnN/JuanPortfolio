'use client'
import React, { useEffect, useState } from 'react'
import { useConfig } from '@payloadcms/ui'

interface AnalysisRow {
  query: string
  clicks: number
  impressions: number
  ctr: number
}

interface Stats {
  totalClicks: number
  totalImpressions: number
  winners: AnalysisRow[]
  opportunities: AnalysisRow[]
}

export const GSCAnalysis: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const { config } = useConfig()
  const serverURL = config.serverURL

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${serverURL}/api/gsc-metrics?limit=500&sort=-date`)
        const json = await response.json()
        const docs = (json.docs || []) as AnalysisRow[]

        if (docs.length > 0) {
          const totalClicks = docs.reduce((acc, r) => acc + r.clicks, 0)
          const totalImpressions = docs.reduce((acc, r) => acc + r.impressions, 0)
          
          const winners = [...docs]
            .filter(r => r.impressions > 10)
            .sort((a, b) => b.ctr - a.ctr)
            .slice(0, 5)

          const opportunities = [...docs]
            .filter(r => r.impressions > 50 && r.ctr < 0.02)
            .sort((a, b) => b.impressions - a.impressions)
            .slice(0, 5)

          setStats({ totalClicks, totalImpressions, winners, opportunities })
        }
      } catch (error) {
        console.error('Error fetching GSC analysis:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalysis()
  }, [serverURL])

  if (loading) return <div style={{ padding: '20px', color: '#6B7280', fontSize: '13px' }}>Generando auditoría de rendimiento...</div>
  if (!stats) return null

  return (
    <div style={{ 
      padding: '24px', 
      backgroundColor: 'transparent', 
      border: '1px solid var(--theme-border-color)',
      borderRadius: '12px' 
    }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Auditoría Estratégica Automática</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div>
          <h4 style={{ color: '#059669', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px' }}>Consultas de Alto Rendimiento</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {stats.winners.map((w, i) => (
              <li key={i} style={{ padding: '10px 0', borderTop: '1px solid var(--theme-border-color)', fontSize: '12px' }}>
                <span style={{ fontWeight: 600 }}>{w.query}</span> — {(w.ctr * 100).toFixed(1)}% CTR ({w.clicks} clics)
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 style={{ color: '#D97706', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px' }}>Oportunidades de Optimización</h4>
          <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '12px' }}>Alta visibilidad con baja tasa de clic. Recomendación: Optimizar meta-títulos.</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {stats.opportunities.map((o, i) => (
              <li key={i} style={{ padding: '10px 0', borderTop: '1px solid var(--theme-border-color)', fontSize: '12px' }}>
                <span style={{ fontWeight: 600 }}>{o.query}</span> — {o.impressions} impresiones — {(o.ctr * 100).toFixed(1)}% CTR
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
