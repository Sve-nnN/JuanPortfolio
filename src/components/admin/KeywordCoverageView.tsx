'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { useConfig } from '@payloadcms/ui'
// TYPES ONLY from the core — never the runtime analyzer, so `natural` stays
// server-side (threat T-23-SC). Data arrives via the /api/seo/keyword-coverage
// endpoint, which runs the audit on the server.
import type {
  CoverageRow,
  KeywordCoverageReport,
} from '@/utilities/seo/keywordCoverageAudit'
// Dependency-light label map (no `natural`) — safe to import at runtime.
import { CHECK_LABELS } from '@/utilities/seo/keywordScore'
import type { KeywordCheckId } from '@/utilities/seo/keywordScore'

type Lang = 'es' | 'en'

const T = {
  title: { es: 'Cobertura de keywords', en: 'Keyword coverage' },
  subtitle: {
    es: 'Auditoría de cobertura de keywords sobre posts, páginas y listados',
    en: 'Keyword coverage audit across posts, pages and listings',
  },
  refresh: { es: 'Refrescar', en: 'Refresh' },
  loading: { es: 'Cargando auditoría…', en: 'Loading audit…' },
  error: {
    es: 'No se pudo cargar la auditoría.',
    en: 'Could not load the audit.',
  },
  total: { es: 'Total', en: 'Total' },
  noKeyword: { es: 'Sin keyword', en: 'No keyword' },
  unresolved: { es: 'Sin resolver', en: 'Unresolved' },
  failing: { es: 'Fallando', en: 'Failing' },
  passing: { es: 'OK', en: 'Passing' },
  section1: { es: 'Páginas sin keyword', en: 'Pages without keyword' },
  section3: {
    es: 'Páginas con relación de keyword sin resolver',
    en: 'Pages with unresolved keyword relation',
  },
  emptyUnresolved: {
    es: 'Ninguna relación de keyword colgante.',
    en: 'No dangling keyword relations.',
  },
  section2: { es: 'Páginas con checks fallando', en: 'Pages failing checks' },
  truncated: {
    es: 'Reporte truncado: algunas colecciones superan el límite de consulta y la cobertura está subreportada',
    en: 'Truncated report: some collections exceed the query cap and coverage is under-reported',
  },
  colCollection: { es: 'Colección', en: 'Collection' },
  colPage: { es: 'Página', en: 'Page' },
  colFailing: { es: 'Checks que fallan', en: 'Failing checks' },
  colWarnings: { es: 'Avisos', en: 'Warnings' },
  emptyNoKeyword: {
    es: 'Todas las páginas tienen keyword asignada.',
    en: 'Every page has a keyword assigned.',
  },
  emptyFailing: {
    es: 'Ninguna página con keyword falla checks.',
    en: 'No keyworded page is failing checks.',
  },
  generatedAt: { es: 'Generado', en: 'Generated' },
  none: { es: '—', en: '—' },
} as const

const checkLabel = (id: KeywordCheckId, lang: Lang): string =>
  CHECK_LABELS[id]?.[lang] ?? id

export const KeywordCoverageView: React.FC = () => {
  const { config } = useConfig()
  // IN-04: serverURL may be undefined depending on config — fall back to a
  // relative path so the fetch still resolves against the current origin.
  const base = config.serverURL ?? ''

  const [lang, setLang] = useState<Lang>('es')
  const [report, setReport] = useState<KeywordCoverageReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // WR-01: AbortController so a fast es/en toggle or repeated Refresh cancels the
  // in-flight request and never lets a superseded/late response win the state,
  // and never setState after unmount.
  const fetchReport = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      setError(false)
      try {
        const res = await fetch(`${base}/api/seo/keyword-coverage?locale=${lang}`, {
          credentials: 'include',
          cache: 'no-store',
          signal,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json()) as KeywordCoverageReport
        if (signal?.aborted) return
        setReport(json)
      } catch (err) {
        // A superseded/aborted request is expected — ignore it entirely.
        if (err instanceof Error && err.name === 'AbortError') return
        if (signal?.aborted) return
        console.error('[KeywordCoverageView] fetch error:', err)
        setError(true)
      } finally {
        if (!signal?.aborted) setLoading(false)
      }
    },
    [base, lang],
  )

  // AUDIT-03: fetch on mount and whenever the language changes; the Refresh
  // button calls the same fetch so data is always live (no stale snapshot).
  // The cleanup aborts the previous request before a new one starts.
  useEffect(() => {
    const controller = new AbortController()
    void fetchReport(controller.signal)
    return () => controller.abort()
  }, [fetchReport])

  return (
    <div
      style={{
        padding: '40px',
        maxWidth: '1440px',
        margin: '0 auto',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
            {T.title[lang]}
          </h1>
          <p style={{ color: '#6B7280', fontSize: '14px' }}>{T.subtitle[lang]}</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              gap: '4px',
              backgroundColor: 'rgba(0,0,0,0.05)',
              padding: '4px',
              borderRadius: '8px',
            }}
          >
            {(['es', 'en'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: lang === l ? 'var(--theme-bg)' : 'transparent',
                  color: lang === l ? '#2563EB' : '#4B5563',
                  boxShadow: lang === l ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => void fetchReport()}
            disabled={loading}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--theme-border-color)',
              borderRadius: '8px',
              cursor: loading ? 'default' : 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: 'var(--theme-bg)',
              color: 'var(--theme-text)',
              opacity: loading ? 0.6 : 1,
            }}
          >
            ↻ {T.refresh[lang]}
          </button>
        </div>
      </header>

      {loading && (
        <div style={{ padding: '40px', color: '#6B7280' }}>{T.loading[lang]}</div>
      )}

      {error && !loading && (
        <div style={{ padding: '40px', color: '#DC2626', fontWeight: 600 }}>
          {T.error[lang]}
        </div>
      )}

      {report && !loading && !error && (
        <>
          {/* WR-02: truncation must be visible, never silent. */}
          {report.truncated && (
            <div
              style={{
                padding: '14px 18px',
                marginBottom: '24px',
                borderRadius: '8px',
                backgroundColor: 'rgba(217, 119, 6, 0.1)',
                border: '1px solid #D97706',
                color: '#92400E',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              ⚠ {T.truncated[lang]}
              {report.truncatedCollections.length > 0
                ? ` (${report.truncatedCollections.join(', ')})`
                : ''}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '24px',
              marginBottom: '12px',
            }}
          >
            <MetricCard label={T.total[lang]} value={report.counts.total} color="#2563EB" />
            <MetricCard
              label={T.noKeyword[lang]}
              value={report.counts.noKeyword}
              color="#D97706"
            />
            <MetricCard
              label={T.unresolved[lang]}
              value={report.counts.unresolvedKeyword}
              color="#B45309"
            />
            <MetricCard label={T.failing[lang]} value={report.counts.failing} color="#DC2626" />
            <MetricCard label={T.passing[lang]} value={report.counts.passing} color="#059669" />
          </div>

          <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '32px' }}>
            {T.generatedAt[lang]}: {new Date(report.generatedAt).toLocaleString()}
          </p>

          {/* Section 1 — AUDIT-01: pages without a keyword */}
          <section style={{ marginBottom: '40px' }}>
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#D97706',
                marginBottom: '16px',
              }}
            >
              {T.section1[lang]} ({report.noKeyword.length})
            </h2>
            {report.noKeyword.length === 0 ? (
              <EmptyRow text={T.emptyNoKeyword[lang]} />
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr
                    style={{
                      textAlign: 'left',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      color: '#6B7280',
                    }}
                  >
                    <th style={{ paddingBottom: '12px', width: '140px' }}>
                      {T.colCollection[lang]}
                    </th>
                    <th style={{ paddingBottom: '12px' }}>{T.colPage[lang]}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.noKeyword.map((row) => (
                    <tr
                      key={`${row.collection}-${row.id}`}
                      style={{ borderTop: '1px solid var(--theme-border-color)' }}
                    >
                      <td style={{ padding: '14px 0', fontSize: '12px', color: '#6B7280' }}>
                        {row.collection}
                      </td>
                      <td style={{ padding: '14px 0', fontSize: '13px' }}>
                        <PageLink row={row} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Section 3 — WR-04: keyword relation set but unresolved/dangling */}
          {report.unresolvedKeyword.length > 0 && (
            <section style={{ marginBottom: '40px' }}>
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#B45309',
                  marginBottom: '16px',
                }}
              >
                {T.section3[lang]} ({report.unresolvedKeyword.length})
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr
                    style={{
                      textAlign: 'left',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      color: '#6B7280',
                    }}
                  >
                    <th style={{ paddingBottom: '12px', width: '140px' }}>
                      {T.colCollection[lang]}
                    </th>
                    <th style={{ paddingBottom: '12px' }}>{T.colPage[lang]}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.unresolvedKeyword.map((row) => (
                    <tr
                      key={`${row.collection}-${row.id}`}
                      style={{ borderTop: '1px solid var(--theme-border-color)' }}
                    >
                      <td style={{ padding: '14px 0', fontSize: '12px', color: '#6B7280' }}>
                        {row.collection}
                      </td>
                      <td style={{ padding: '14px 0', fontSize: '13px' }}>
                        <PageLink row={row} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Section 2 — AUDIT-02: keyworded pages failing >=1 check */}
          <section>
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#DC2626',
                marginBottom: '16px',
              }}
            >
              {T.section2[lang]} ({report.failing.length})
            </h2>
            {report.failing.length === 0 ? (
              <EmptyRow text={T.emptyFailing[lang]} />
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr
                    style={{
                      textAlign: 'left',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      color: '#6B7280',
                    }}
                  >
                    <th style={{ paddingBottom: '12px', width: '120px' }}>
                      {T.colCollection[lang]}
                    </th>
                    <th style={{ paddingBottom: '12px' }}>{T.colPage[lang]}</th>
                    <th style={{ paddingBottom: '12px' }}>{T.colFailing[lang]}</th>
                    <th style={{ paddingBottom: '12px' }}>{T.colWarnings[lang]}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.failing.map((row) => (
                    <tr
                      key={`${row.collection}-${row.id}`}
                      style={{ borderTop: '1px solid var(--theme-border-color)', verticalAlign: 'top' }}
                    >
                      <td style={{ padding: '14px 0', fontSize: '12px', color: '#6B7280' }}>
                        {row.collection}
                      </td>
                      <td style={{ padding: '14px 0', fontSize: '13px' }}>
                        <PageLink row={row} />
                      </td>
                      <td style={{ padding: '14px 0' }}>
                        <CheckPills ids={row.failingChecks} lang={lang} tone="red" />
                      </td>
                      <td style={{ padding: '14px 0' }}>
                        {row.amberChecks.length > 0 ? (
                          <CheckPills ids={row.amberChecks} lang={lang} tone="amber" />
                        ) : (
                          <span style={{ color: '#9CA3AF', fontSize: '12px' }}>{T.none[lang]}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  )
}

const PageLink: React.FC<{ row: CoverageRow }> = ({ row }) => {
  if (!row.url) return <span>{row.label}</span>
  return (
    <a
      href={row.url}
      style={{ color: '#2563EB', textDecoration: 'none' }}
      target="_blank"
      rel="noreferrer"
    >
      {row.label}
    </a>
  )
}

const CheckPills: React.FC<{
  ids: KeywordCheckId[]
  lang: Lang
  tone: 'red' | 'amber'
}> = ({ ids, lang, tone }) => {
  const bg = tone === 'red' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(217, 119, 6, 0.1)'
  const color = tone === 'red' ? '#DC2626' : '#D97706'
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {ids.map((id) => (
        <span
          key={id}
          style={{
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: bg,
            color,
          }}
        >
          {checkLabel(id, lang)}
        </span>
      ))}
    </div>
  )
}

const EmptyRow: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      padding: '20px',
      border: '1px dashed var(--theme-border-color)',
      borderRadius: '8px',
      color: '#059669',
      fontSize: '14px',
      fontWeight: 600,
    }}
  >
    ✓ {text}
  </div>
)

const MetricCard: React.FC<{ label: string; value: number; color: string }> = ({
  label,
  value,
  color,
}) => (
  <div
    style={{
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid var(--theme-border-color)',
      backgroundColor: 'transparent',
    }}
  >
    <span
      style={{
        fontSize: '12px',
        color: '#6B7280',
        fontWeight: 600,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
    <div style={{ fontSize: '28px', fontWeight: 700, color, marginTop: '8px' }}>
      {value.toLocaleString()}
    </div>
  </div>
)
