'use client'

/**
 * SEOScoreField Component
 * Visual display of SEO score with circular progress indicator
 */

import React from 'react'
import { useFieldProps } from '@payloadcms/ui'

interface SEOScoreFieldProps {
  path: string
}

export function SEOScoreField({ path }: SEOScoreFieldProps) {
  const { value } = useFieldProps({ path })
  const score = typeof value === 'number' ? value : 0

  // Determine color based on score
  let color = '#EF4444' // red (poor)
  let label = 'Pobre'

  if (score >= 80) {
    color = '#10B981' // green (excellent)
    label = 'Excelente'
  } else if (score >= 60) {
    color = '#3B82F6' // blue (good)
    label = 'Bueno'
  } else if (score >= 40) {
    color = '#F59E0B' // yellow (fair)
    label = 'Regular'
  }

  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1.5rem',
        backgroundColor: '#F9FAFB',
        borderRadius: '0.5rem',
        border: '1px solid #E5E7EB',
      }}
    >
      <div style={{ position: 'relative', width: '120px', height: '120px' }}>
        {/* Background circle */}
        <svg width="120" height="120" style={{ position: 'absolute', top: 0, left: 0 }}>
          <circle cx="60" cy="60" r="45" fill="none" stroke="#E5E7EB" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        {/* Score text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color,
            }}
          >
            {score}
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: '#6B7280',
            }}
          >
            de 100
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: '1rem',
          fontSize: '1.125rem',
          fontWeight: '600',
          color,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: '0.5rem',
          fontSize: '0.875rem',
          color: '#6B7280',
          textAlign: 'center',
        }}
      >
        Puntuación SEO
      </div>
    </div>
  )
}
