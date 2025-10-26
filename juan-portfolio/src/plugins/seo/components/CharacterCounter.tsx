'use client'

/**
 * CharacterCounter Component
 * Shows character count with color coding based on SEO best practices
 */

import React from 'react'
import { useFieldProps } from '@payloadcms/ui'

interface CharacterCounterProps {
  path: string
  min?: number
  max?: number
  optimal?: { min: number; max: number }
}

export function CharacterCounter({ path, min, max, optimal }: CharacterCounterProps) {
  const { value } = useFieldProps({ path })
  const length = typeof value === 'string' ? value.length : 0

  // Determine color based on length
  let color = '#6B7280' // gray (default)
  let status = 'Neutro'

  if (optimal && length >= optimal.min && length <= optimal.max) {
    color = '#10B981' // green
    status = 'Óptimo'
  } else if (max && length > max) {
    color = '#EF4444' // red
    status = 'Demasiado largo'
  } else if (min && length < min) {
    color = '#F59E0B' // yellow
    status = 'Demasiado corto'
  } else if (length > 0) {
    color = '#F59E0B' // yellow
    status = 'Aceptable'
  }

  return (
    <div
      style={{
        marginTop: '0.5rem',
        fontSize: '0.875rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span style={{ color }}>
        {length} caracteres - {status}
      </span>
      {optimal && (
        <span style={{ color: '#6B7280' }}>
          Óptimo: {optimal.min}-{optimal.max}
        </span>
      )}
      {max && !optimal && <span style={{ color: '#6B7280' }}>Máximo: {max}</span>}
    </div>
  )
}
