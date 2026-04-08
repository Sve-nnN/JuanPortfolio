'use client'

import React from 'react'
import { useField } from '@payloadcms/ui'

interface CWVBadgeProps {
  path: string
  metric: 'score' | 'lcp' | 'cls' | 'inp' | 'fid' | 'fcp'
}

type Thresholds = {
  good: number
  poor: number
}

const THRESHOLDS: Record<string, Thresholds> = {
  score: { good: 90, poor: 50 }, // 90-100 green, 50-89 orange, 0-49 red
  lcp: { good: 2.5, poor: 4.0 }, // <2.5 green, >4.0 red
  cls: { good: 0.1, poor: 0.25 }, // <0.1 green, >0.25 red
  inp: { good: 200, poor: 500 }, // <200 green, >500 red
  fid: { good: 100, poor: 300 },
  fcp: { good: 1.8, poor: 3.0 },
}

const getColor = (value: number, metric: string) => {
  const t = THRESHOLDS[metric]
  if (!t) return 'bg-gray-100 text-gray-800'

  if (metric === 'score') {
    // Higher is better
    if (value >= t.good) return 'bg-green-100 text-green-800 border-green-200'
    if (value >= t.poor) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  } else {
    // Lower is better
    if (value <= t.good) return 'bg-green-100 text-green-800 border-green-200'
    if (value <= t.poor) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }
}

export const CWVBadge: React.FC<CWVBadgeProps> = ({ path, metric }) => {
  const { value } = useField<number>({ path })

  if (value === undefined || value === null) {
    return <span className="text-gray-400">-</span>
  }

  const colorClasses = getColor(value, metric)

  // Normalize to max 3 decimals
  const displayValue = typeof value === 'number' ? Math.round(value * 1000) / 1000 : value

  return (
    <div
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses}`}
    >
      {displayValue}
    </div>
  )
}
