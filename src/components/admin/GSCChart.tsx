'use client'
import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface ChartData {
  date: string
  clicks: number
  impressions: number
}

interface GSCChartProps {
  data: ChartData[]
  height?: number
}

export const GSCChart: React.FC<GSCChartProps> = ({ data, height = 300 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--theme-bg)', borderRadius: '8px', border: '1px solid var(--theme-border-color)' }}>
        <p>No hay datos disponibles para el gráfico.</p>
      </div>
    )
  }

  // Ordenar por fecha y formatear para el gráfico
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div style={{ 
      width: '100%', 
      height, 
      padding: '20px', 
      backgroundColor: 'var(--theme-bg)', 
      borderRadius: '8px', 
      border: '1px solid var(--theme-border-color)',
      marginTop: '20px'
    }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={sortedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9333ea" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--theme-border-color)" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(str) => {
              const date = new Date(str)
              return `${date.getDate()}/${date.getMonth() + 1}`
            }}
            tick={{ fontSize: 12, fill: '#888' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fontSize: 12, fill: '#888' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            tick={{ fontSize: 12, fill: '#888' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--theme-bg)', 
              borderColor: 'var(--theme-border-color)',
              color: 'var(--theme-text)',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
          />
          <Legend verticalAlign="top" height={36}/>
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="clicks"
            name="Clicks"
            stroke="#2563eb"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorClicks)"
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="impressions"
            name="Impresiones"
            stroke="#9333ea"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorImpressions)"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
