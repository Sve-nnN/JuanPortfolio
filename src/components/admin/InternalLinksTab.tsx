'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useConfig, useDocumentInfo } from '@payloadcms/ui'
import type {
  LinkSuggestion,
  SuggestionsResponse,
  ApplyLinkBody,
  ApplyLinkResponse,
} from '@/types/admin/internal-links'

const suggestionKey = (s: LinkSuggestion) => `${s.lineNumber}:${s.keyword}:${s.targetSlug}`

const truncate = (str: string, max: number) =>
  str.length > max ? str.slice(0, max) + '...' : str

export const InternalLinksTab: React.FC = () => {
  const { config } = useConfig()
  const serverURL = config.serverURL
  const { initialData } = useDocumentInfo()
  const slug: string | undefined = initialData?.slug as string | undefined

  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [applyErrors, setApplyErrors] = useState<Record<string, string>>({})
  const [applying, setApplying] = useState<Set<string>>(new Set())
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!slug) return
    let isMounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `${serverURL}/api/internal-links?slug=${encodeURIComponent(slug)}`,
          { credentials: 'include' },
        )
        if (!isMounted) return
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: SuggestionsResponse = await res.json()
        if (!isMounted) return
        setSuggestions(data.suggestions)
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Failed to load suggestions')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [slug, serverURL, refreshKey])

  const handlePreview = useCallback(
    (s: LinkSuggestion) => {
      const key = suggestionKey(s)
      if (previews[key]) {
        setPreviews((prev) => {
          const next = { ...prev }
          delete next[key]
          return next
        })
        return
      }
      const before = s.context
      const after = s.context.replace(
        new RegExp(`(${s.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i'),
        `[$1](${s.targetUrl})`,
      )
      setPreviews((prev) => ({ ...prev, [key]: `BEFORE:\n${before}\n\nAFTER:\n${after}` }))
    },
    [previews],
  )

  const handleApply = useCallback(
    async (s: LinkSuggestion) => {
      const key = suggestionKey(s)
      setApplying((prev) => new Set(prev).add(key))
      setApplyErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      try {
        const body: ApplyLinkBody = {
          sourceSlug: s.sourceSlug,
          filePath: s.filePath,
          keyword: s.keyword,
          targetUrl: s.targetUrl,
          lineNumber: s.lineNumber,
        }
        const res = await fetch(`${serverURL}/api/internal-links/apply`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data: ApplyLinkResponse = await res.json()
        if (data.success) {
          setApplied((prev) => new Set(prev).add(key))
        } else {
          setApplyErrors((prev) => ({ ...prev, [key]: data.error || data.message }))
        }
      } catch (err) {
        setApplyErrors((prev) => ({
          ...prev,
          [key]: err instanceof Error ? err.message : 'Apply failed',
        }))
      } finally {
        setApplying((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      }
    },
    [serverURL],
  )

  const handleRefresh = useCallback(() => {
    setSuggestions([])
    setApplied(new Set())
    setPreviews({})
    setApplyErrors({})
    setRefreshKey((k) => k + 1)
  }, [])

  if (!slug) {
    return (
      <div style={{ padding: '32px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ color: '#6B7280', padding: '16px' }}>
          Guarda el documento primero para ver sugerencias.
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Internal Links</h2>
        <button
          onClick={handleRefresh}
          style={{
            border: '1px solid #D1D5DB',
            background: 'transparent',
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div style={{ color: '#6B7280', padding: '16px' }}>Cargando sugerencias...</div>
      )}

      {!loading && error && (
        <div style={{ color: '#DC2626', padding: '16px' }}>Error: {error}</div>
      )}

      {!loading && !error && suggestions.length === 0 && (
        <div style={{ color: '#6B7280', padding: '16px' }}>No se encontraron sugerencias.</div>
      )}

      {!loading && !error && suggestions.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #E5E7EB' }}>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Target Post</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Keyword</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Confidence</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Context</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#374151' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((s) => {
                const key = suggestionKey(s)
                const isApplied = applied.has(key)
                const isApplying = applying.has(key)
                const applyError = applyErrors[key]
                const preview = previews[key]

                return (
                  <React.Fragment key={key}>
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '10px 12px', color: '#1F2937' }}>{s.targetTitle}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#4B5563' }}>
                        {s.keyword}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#6B7280' }}>
                        {Math.round(s.confidence * 100)}%
                      </td>
                      <td
                        style={{ padding: '10px 12px', color: '#6B7280', maxWidth: '300px' }}
                        title={s.context}
                      >
                        {truncate(s.context, 80)}
                      </td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        {isApplied ? (
                          <span style={{ color: '#059669', fontWeight: 600 }}>Applied</span>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handlePreview(s)}
                              style={{
                                border: '1px solid #6B7280',
                                background: 'transparent',
                                borderRadius: '4px',
                                padding: '4px 10px',
                                cursor: 'pointer',
                                fontSize: '12px',
                              }}
                            >
                              {preview ? 'Hide' : 'Preview'}
                            </button>
                            <button
                              onClick={() => handleApply(s)}
                              disabled={isApplying}
                              style={{
                                background: '#2563EB',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 10px',
                                cursor: isApplying ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                opacity: isApplying ? 0.5 : 1,
                              }}
                            >
                              {isApplying ? 'Applying...' : 'Apply'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {applyError && (
                      <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td
                          colSpan={5}
                          style={{ padding: '8px 12px', color: '#DC2626', fontSize: '12px' }}
                        >
                          {applyError}
                        </td>
                      </tr>
                    )}

                    {preview && (
                      <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td colSpan={5} style={{ padding: '0 12px 12px' }}>
                          <pre
                            style={{
                              background: 'rgba(0,0,0,0.04)',
                              padding: '12px',
                              fontSize: '12px',
                              whiteSpace: 'pre-wrap',
                              borderRadius: '4px',
                              margin: 0,
                            }}
                          >
                            {preview}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
