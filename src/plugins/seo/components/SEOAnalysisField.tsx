'use client'

/**
 * SEOAnalysisField Component
 * Displays SEO analysis results with issues, suggestions, and metrics
 */

import React, { useState } from 'react'
import { useField } from '@payloadcms/ui'

interface SEOIssue {
  type: 'error' | 'warning' | 'success' | 'info'
  category: string
  message: string
  impact: number
}

interface SEOAnalysis {
  issues: SEOIssue[]
  suggestions: string[]
  metrics: {
    titleLength?: number
    descriptionLength?: number
    contentLength?: number
    keywordDensity?: number
    readabilityScore?: number
    h1Count?: number
    h2Count?: number
  }
}

interface SEOAnalysisFieldProps {
  path: string
}

export function SEOAnalysisField({ path }: SEOAnalysisFieldProps) {
  const { value } = useField({ path })
  const [expandedSuggestions, setExpandedSuggestions] = useState(false)

  const analysis: SEOAnalysis =
    typeof value === 'object' && value !== null
      ? (value as SEOAnalysis)
      : {
          issues: [],
          suggestions: [],
          metrics: {},
        }

  const { issues = [], suggestions = [], metrics = {} } = analysis

  // Group issues by type
  const errors = issues.filter((i) => i.type === 'error')
  const warnings = issues.filter((i) => i.type === 'warning')
  const successes = issues.filter((i) => i.type === 'success')

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'success':
        return '✅'
      default:
        return 'ℹ️'
    }
  }

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'error':
        return '#EF4444'
      case 'warning':
        return '#F59E0B'
      case 'success':
        return '#10B981'
      default:
        return '#3B82F6'
    }
  }

  return (
    <div
      style={{
        padding: '1.5rem',
        backgroundColor: '#F9FAFB',
        borderRadius: '0.5rem',
        border: '1px solid #E5E7EB',
      }}
    >
      {/* Metrics Summary */}
      {Object.keys(metrics).length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>Métricas</h4>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {metrics.titleLength !== undefined && (
              <div style={{ fontSize: '0.875rem' }}>
                <span style={{ color: '#6B7280' }}>Título:</span>{' '}
                <span style={{ fontWeight: '600' }}>{metrics.titleLength} caracteres</span>
              </div>
            )}
            {metrics.descriptionLength !== undefined && (
              <div style={{ fontSize: '0.875rem' }}>
                <span style={{ color: '#6B7280' }}>Descripción:</span>{' '}
                <span style={{ fontWeight: '600' }}>{metrics.descriptionLength} caracteres</span>
              </div>
            )}
            {metrics.contentLength !== undefined && (
              <div style={{ fontSize: '0.875rem' }}>
                <span style={{ color: '#6B7280' }}>Contenido:</span>{' '}
                <span style={{ fontWeight: '600' }}>{metrics.contentLength} palabras</span>
              </div>
            )}
            {metrics.keywordDensity !== undefined && (
              <div style={{ fontSize: '0.875rem' }}>
                <span style={{ color: '#6B7280' }}>Densidad:</span>{' '}
                <span style={{ fontWeight: '600' }}>{metrics.keywordDensity.toFixed(2)}%</span>
              </div>
            )}
            {metrics.readabilityScore !== undefined && (
              <div style={{ fontSize: '0.875rem' }}>
                <span style={{ color: '#6B7280' }}>Legibilidad:</span>{' '}
                <span style={{ fontWeight: '600' }}>{metrics.readabilityScore.toFixed(1)}</span>
              </div>
            )}
            {metrics.h1Count !== undefined && (
              <div style={{ fontSize: '0.875rem' }}>
                <span style={{ color: '#6B7280' }}>H1:</span>{' '}
                <span style={{ fontWeight: '600' }}>{metrics.h1Count}</span>
              </div>
            )}
            {metrics.h2Count !== undefined && (
              <div style={{ fontSize: '0.875rem' }}>
                <span style={{ color: '#6B7280' }}>H2:</span>{' '}
                <span style={{ fontWeight: '600' }}>{metrics.h2Count}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Issues */}
      {issues.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>
            Problemas y Mejoras
          </h4>

          {/* Errors */}
          {errors.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              {errors.map((issue, index) => (
                <div
                  key={`error-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    backgroundColor: '#FEE2E2',
                    borderRadius: '0.375rem',
                    border: `1px solid ${getIssueColor(issue.type)}`,
                  }}
                >
                  <span style={{ marginRight: '0.5rem', fontSize: '1rem' }}>
                    {getIssueIcon(issue.type)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#991B1B' }}>
                      {issue.category}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#7F1D1D', marginTop: '0.25rem' }}>
                      {issue.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              {warnings.map((issue, index) => (
                <div
                  key={`warning-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    backgroundColor: '#FEF3C7',
                    borderRadius: '0.375rem',
                    border: `1px solid ${getIssueColor(issue.type)}`,
                  }}
                >
                  <span style={{ marginRight: '0.5rem', fontSize: '1rem' }}>
                    {getIssueIcon(issue.type)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#92400E' }}>
                      {issue.category}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#78350F', marginTop: '0.25rem' }}>
                      {issue.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Successes */}
          {successes.length > 0 && (
            <div>
              {successes.map((issue, index) => (
                <div
                  key={`success-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    backgroundColor: '#D1FAE5',
                    borderRadius: '0.375rem',
                    border: `1px solid ${getIssueColor(issue.type)}`,
                  }}
                >
                  <span style={{ marginRight: '0.5rem', fontSize: '1rem' }}>
                    {getIssueIcon(issue.type)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#065F46' }}>
                      {issue.category}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#047857', marginTop: '0.25rem' }}>
                      {issue.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <h4 style={{ fontSize: '1rem', fontWeight: '600' }}>
              Sugerencias ({suggestions.length})
            </h4>
            <button
              onClick={() => setExpandedSuggestions(!expandedSuggestions)}
              style={{
                fontSize: '0.875rem',
                color: '#3B82F6',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: 0,
              }}
            >
              {expandedSuggestions ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {expandedSuggestions && (
            <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
              {suggestions.map((suggestion, index) => (
                <li
                  key={`suggestion-${index}`}
                  style={{
                    fontSize: '0.875rem',
                    color: '#4B5563',
                    marginBottom: '0.5rem',
                  }}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Empty state */}
      {issues.length === 0 && suggestions.length === 0 && Object.keys(metrics).length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#6B7280',
            fontSize: '0.875rem',
          }}
        >
          No hay análisis SEO disponible. Guarda el documento para generar un análisis.
        </div>
      )}
    </div>
  )
}
