'use client'
import React, { useEffect, useState } from 'react'
import { useConfig } from '@payloadcms/ui'
import Link from 'next/link'
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts'

interface GSCMetricRow {
  date: string
  clicks: number
}

export const GSCSummary: React.FC = () => {
  const [data, setData] = useState<GSCMetricRow[]>([])
  const [totalClicks, setTotalClicks] = useState(0)
  const { config } = useConfig()
  const serverURL = config.serverURL

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch(`${serverURL}/api/gsc-metrics?limit=300&sort=-date`)
        const json = await response.json()
        const docs = (json.docs || []) as { date: string, clicks: number }[]

        const dateMap = new Map<string, GSCMetricRow>()
        let clicks = 0
        docs.forEach((row) => {
          const date = row.date.split('T')[0]
          const current = dateMap.get(date) || { date, clicks: 0 }
          dateMap.set(date, { date, clicks: current.clicks + row.clicks })
          clicks += row.clicks
        })

        setData(Array.from(dateMap.values()).slice(0, 7).reverse())
        setTotalClicks(clicks)
      } catch (error) {
        console.error('Error fetching GSC summary:', error)
      }
    }
    fetchSummary()
  }, [serverURL])

  if (data.length === 0) return null

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: 'var(--theme-bg)', 
      borderRadius: '8px', 
      border: '1px solid var(--theme-border-color)',
      marginBottom: '30px',
      display: 'flex',
      alignItems: 'center',
      gap: '30px'
    }}>
      <div style={{ flex: '0 0 auto' }}>
        <h4 style={{ margin: 0, fontSize: '14px', color: '#666' }}>Clicks últimos 7 días</h4>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb' }}>{totalClicks}</div>
      </div>
      <div style={{ flex: '1 1 auto', height: '60px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="date" hide />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ fontSize: '10px', padding: '5px' }}
            />
            <Bar dataKey="clicks" fill="#2563eb" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ flex: '0 0 auto' }}>
        <Link href="/admin/gsc-dashboard" style={{ 
          fontSize: '12px', 
          color: '#2563eb', 
          textDecoration: 'none', 
          fontWeight: 'bold',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #2563eb'
        }}>
          Ver Dashboard Completo →
        </Link>
      </div>
    </div>
  )
}
