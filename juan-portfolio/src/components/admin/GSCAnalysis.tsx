'use client'
import React, { useEffect, useState } from 'react'
import { useConfig } from '@payloadcms/ui'

export const GSCAnalysis: React.FC = () => {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { config } = useConfig()
  const serverURL = config.serverURL

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${serverURL}/api/gsc-metrics?limit=500&sort=-date`)
        const json = await response.json()
        const docs = json.docs || []

        if (docs.length > 0) {
          // Calculate insights
          const totalClicks = docs.reduce((acc: number, r: any) => acc + r.clicks, 0)
          const totalImpressions = docs.reduce((acc: number, r: any) => acc + r.impressions, 0)
          
          // Winners (queries with highest CTR)
          const winners = [...docs]
            .filter(r => r.impressions > 10)
            .sort((a, b) => b.ctr - a.ctr)
            .slice(0, 5)

          // Opportunities (high impressions, low CTR)
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

  if (loading) return <div style={{ padding: '20px', color: '#666' }}>Analyzing GSC data...</div>
  if (!stats) return null

  return (
    <div style={{ 
      padding: '20px', 
      marginBottom: '30px', 
      backgroundColor: 'var(--theme-bg)', 
      border: '1px solid var(--theme-border-color)',
      borderRadius: '6px' 
    }}>
      <h2 style={{ marginBottom: '20px' }}>GSC Automated Analysis</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <div>
          <h4 style={{ color: 'var(--theme-success-500)', marginBottom: '10px' }}>🔥 High CTR Queries (Winners)</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {stats.winners.map((w: any, i: number) => (
              <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--theme-border-color)', fontSize: '13px' }}>
                <strong>{w.query}</strong> - {(w.ctr * 100).toFixed(1)}% CTR ({w.clicks} clicks)
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 style={{ color: 'var(--theme-warning-500)', marginBottom: '10px' }}>💡 Optimization Opportunities</h4>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>High impressions but low CTR. Consider improving titles/meta.</p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {stats.opportunities.map((o: any, i: number) => (
              <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--theme-border-color)', fontSize: '13px' }}>
                <strong>{o.query}</strong> - {o.impressions} impressions - {(o.ctr * 100).toFixed(1)}% CTR
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
