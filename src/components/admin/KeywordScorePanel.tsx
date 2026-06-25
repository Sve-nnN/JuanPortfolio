'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useDocumentInfo, useAllFormFields, useForm, useLocale, toast } from '@payloadcms/ui'
import { Button } from '@payloadcms/ui/elements/Button'

import type {
  KeywordScoreResult,
  CheckState,
  Bilingual,
} from '@/plugins/seo/types/keywordScore'

/**
 * Sidebar UI field for Posts and Pages. Renders the assigned keyword's metrics,
 * the 7-check Yoast-style traffic light and a 0-100 score badge, recomputing
 * live (~300ms debounce) against /api/seo/keyword-score without publishing.
 *
 * Types are imported type-only from the dependency-light keywordScore module so
 * the `natural` NLP stemmer never reaches the admin bundle — all analysis runs
 * on the server endpoint.
 */

type Locale = 'es' | 'en'

type PrimaryKeywordValue =
  | string
  | {
      id?: string | null
      value?: string | null
      keyword?: string | null
      volume?: number | null
      difficulty?: number | null
      intent?: string | null
      opportunityScore?: number | null
    }
  | null
  | undefined

interface KeywordMetrics {
  keyword: string
  volume?: number | null
  difficulty?: number | null
  intent?: string | null
  opportunityScore?: number | null
}

// Light-theme hex fallbacks documented in the UI-SPEC; theme vars adapt to dark.
const statusColor = (state: CheckState): string => {
  if (state === 'green') return 'var(--theme-success-500, #16a34a)'
  if (state === 'amber') return 'var(--theme-warning-500, #d97706)'
  return 'var(--theme-error-500, #dc2626)'
}

const GLYPH: Record<CheckState, string> = { green: '●', amber: '◐', red: '○' }

const STATE_WORD: Record<CheckState, Bilingual> = {
  green: { es: 'Óptimo', en: 'Good' },
  amber: { es: 'Parcial', en: 'OK' },
  red: { es: 'Ausente', en: 'Missing' },
}

const SCORE_WORD: Record<CheckState, Bilingual> = {
  green: { es: 'Bueno', en: 'Good' },
  amber: { es: 'Mejorable', en: 'OK' },
  red: { es: 'Malo', en: 'Poor' },
}

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--theme-elevation-50)',
  border: '1px solid var(--theme-border-color)',
  borderRadius: '4px',
  padding: '12px',
}

const mutedColor = 'var(--theme-elevation-500)'

const stringOf = (v: unknown): string => (typeof v === 'string' ? v : '')

export const KeywordScorePanel: React.FC = () => {
  const { collectionSlug, initialData } = useDocumentInfo()
  const [fields] = useAllFormFields()
  const { getData } = useForm()
  const { code } = useLocale()
  const locale: Locale = code === 'en' ? 'en' : 'es'
  const tr = (b: Bilingual): string => b[locale]

  // --- Reconstruct the real (unflattened) document data from form state ---
  // `getData()` runs `reduceFieldsToValues(fields, true)` internally, so blocks
  // arrays (Pages `content.layout`) are rebuilt into their nested node tree
  // instead of the flattened row-count metadata stored at `content.layout`.
  // Keyed on `fields` so editing text inside any block re-derives the data and
  // re-triggers the recompute (H1-01).
  const data = useMemo(
    () => getData() as Record<string, unknown>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fields, getData],
  )

  const dataContent = data?.content as Record<string, unknown> | undefined
  const dataMeta = data?.meta as Record<string, unknown> | undefined
  const titleVal = stringOf(data?.title)
  const metaTitle = stringOf(dataMeta?.title)
  const metaDesc = stringOf(dataMeta?.description)
  const slugVal = stringOf(data?.slug)
  // Posts: richText at content.content. Pages: blocks array at content.layout.
  const contentVal = collectionSlug === 'pages' ? dataContent?.layout : dataContent?.content

  // primaryKeyword may be an id string or a populated object; fall back to initialData.
  const pkRaw = (fields?.['primaryKeyword']?.value ??
    (initialData?.primaryKeyword as PrimaryKeywordValue)) as PrimaryKeywordValue
  const keywordId =
    typeof pkRaw === 'string'
      ? pkRaw
      : pkRaw?.id ?? (typeof pkRaw?.value === 'string' ? pkRaw.value : undefined) ?? undefined
  const keywordFromObject =
    typeof pkRaw === 'object' && pkRaw ? stringOf(pkRaw.keyword) : ''

  // --- Fetch the keyword-metrics doc when the assigned keyword changes ---
  const [metrics, setMetrics] = useState<KeywordMetrics | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(false)
  useEffect(() => {
    if (!keywordId) {
      setMetrics(null)
      setMetricsLoading(false)
      return
    }
    let cancelled = false
    setMetricsLoading(true)
    fetch(`/api/keyword-metrics/${keywordId}?depth=0`)
      .then((r) => (r.ok ? r.json() : null))
      .then((doc) => {
        if (cancelled) return
        if (doc && doc.keyword) {
          setMetrics({
            keyword: doc.keyword,
            volume: doc.volume,
            difficulty: doc.difficulty,
            intent: doc.intent,
            opportunityScore: doc.opportunityScore,
          })
        } else {
          // Doc missing or has no keyword string → can't run the checks.
          setMetrics(null)
        }
      })
      .catch(() => {
        if (cancelled) return
        setMetrics(null)
      })
      .finally(() => {
        if (!cancelled) setMetricsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [keywordId])

  const keywordString = (metrics?.keyword || keywordFromObject || '').trim()
  const hasKeyword = Boolean(keywordId || keywordString)

  // --- Live recompute (SCORE-04): debounced POST to the scoring endpoint ---
  const [result, setResult] = useState<KeywordScoreResult | null>(null)
  const [recomputing, setRecomputing] = useState(false)
  const [errored, setErrored] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)

  const requestBody = useMemo(
    () => ({
      keyword: keywordString,
      title: titleVal,
      meta: { title: metaTitle, description: metaDesc },
      slug: slugVal,
      content: contentVal,
      locale,
    }),
    [keywordString, titleVal, metaTitle, metaDesc, slugVal, contentVal, locale],
  )

  useEffect(() => {
    if (!keywordString) {
      setResult(null)
      setRecomputing(false)
      setErrored(false)
      return
    }
    const controller = new AbortController()
    setRecomputing(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/seo/keyword-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('keyword-score request failed')
        const data = (await res.json()) as KeywordScoreResult
        if (controller.signal.aborted) return
        setResult(data)
        setErrored(false)
        setUpdatedAt(Date.now())
      } catch (e) {
        if ((e as { name?: string })?.name === 'AbortError') return
        setErrored(true)
      } finally {
        if (!controller.signal.aborted) setRecomputing(false)
      }
    }, 300)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [requestBody, keywordString])

  // --- Tick so the "hace {n}s" timestamp stays roughly fresh ---
  const [, forceTick] = useState(0)
  useEffect(() => {
    const i = setInterval(() => forceTick((t) => t + 1), 10000)
    return () => clearInterval(i)
  }, [])

  const focusKeywordField = () => {
    if (typeof document === 'undefined') return
    const el = document.getElementById('field-primaryKeyword')
    if (!el) {
      toast.info(
        locale === 'es'
          ? 'Abrí la pestaña Meta y asigná una keyword objetivo.'
          : 'Open the Meta tab and assign a target keyword.',
      )
      return
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const input = el.querySelector('input') as HTMLElement | null
    input?.focus()
  }

  const microText = (): string => {
    if (errored)
      return tr({
        es: 'No se pudo recalcular. Editá un campo para reintentar.',
        en: 'Couldn’t recalculate. Edit a field to retry.',
      })
    if (recomputing && result) return tr({ es: 'Recalculando…', en: 'Recalculating…' })
    if (recomputing && !result) return tr({ es: 'Calculando…', en: 'Calculating…' })
    if (updatedAt) {
      const n = Math.max(0, Math.round((Date.now() - updatedAt) / 1000))
      if (n < 2) return tr({ es: 'Recalculado ahora', en: 'Updated just now' })
      return locale === 'es' ? `Recalculado hace ${n}s` : `Updated ${n}s ago`
    }
    return ''
  }

  const wrapperLabel = tr({ es: 'SEO · Keyword objetivo', en: 'SEO · Target keyword' })

  // --- State 1: no keyword assigned → CTA empty state ---
  if (!hasKeyword) {
    return (
      <div className="field-type custom-field" style={{ marginBottom: '2rem' }}>
        <label className="field-label">{wrapperLabel}</label>
        <div style={{ fontSize: '13px', color: mutedColor }}>
          <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--theme-text)' }}>
            {tr({ es: 'Sin keyword objetivo', en: 'No target keyword' })}
          </div>
          <div style={{ marginBottom: '8px', lineHeight: 1.4 }}>
            {tr({
              es: 'Asigná una keyword objetivo en la pestaña Meta para ver métricas y el semáforo SEO.',
              en: 'Assign a target keyword in the Meta tab to see metrics and the SEO traffic light.',
            })}
          </div>
          <Button buttonStyle="secondary" size="small" onClick={focusKeywordField}>
            {tr({ es: 'Asignar keyword', en: 'Assign keyword' })}
          </Button>
        </div>
      </div>
    )
  }

  // --- State 2: keyword assigned (id exists) but no usable keyword string ---
  // The metrics doc is missing/errored or has an empty keyword, so the checks
  // can't run. Show an explicit loading/error state instead of a permanent
  // "Calculando…" (M2-03).
  if (keywordId && !keywordString) {
    return (
      <div className="field-type custom-field" style={{ marginBottom: '2rem' }}>
        <label className="field-label">{wrapperLabel}</label>
        <div style={{ fontSize: '13px', color: mutedColor, lineHeight: 1.4 }}>
          {metricsLoading
            ? tr({ es: 'Cargando métricas…', en: 'Loading metrics…' })
            : tr({
                es: 'No se pudieron cargar las métricas de esta keyword. Verificá que la keyword asignada exista y volvé a intentarlo.',
                en: "Couldn't load this keyword's metrics. Check that the assigned keyword exists and try again.",
              })}
        </div>
      </div>
    )
  }

  const checks = result?.checks ?? []
  const passCount = result?.passCount ?? 0

  return (
    <div className="field-type custom-field" style={{ marginBottom: '2rem' }}>
      <label className="field-label">{wrapperLabel}</label>

      {/* Score card */}
      {result ? (
        <div
          style={{
            ...cardStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 600 }}>
            {tr({ es: 'Score global', en: 'Overall score' })}
          </span>
          <span
            aria-label={
              locale === 'es'
                ? `Score SEO ${result.score} de 100, ${tr(SCORE_WORD[result.scoreColor])}`
                : `SEO score ${result.score} of 100, ${tr(SCORE_WORD[result.scoreColor])}`
            }
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '64px',
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: statusColor(result.scoreColor),
              color: 'var(--theme-base-0, #ffffff)',
              opacity: recomputing ? 0.6 : 1,
              transition: 'opacity 120ms ease',
            }}
          >
            <span style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1.1 }}>
              {result.score}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600 }}>
              {tr(SCORE_WORD[result.scoreColor])}
            </span>
          </span>
        </div>
      ) : (
        <div
          style={{
            fontSize: '13px',
            fontStyle: 'italic',
            opacity: 0.7,
            marginBottom: '16px',
            color: mutedColor,
          }}
        >
          {tr({ es: 'Calculando…', en: 'Calculating…' })}
        </div>
      )}

      {/* Metrics card */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', marginBottom: '4px' }}>
          {tr({ es: 'Keyword', en: 'Keyword' })}:{' '}
          <strong style={{ fontWeight: 600, wordBreak: 'break-word' }}>
            {keywordString || '—'}
          </strong>
        </div>
        <div style={cardStyle}>
          {metrics ? (
            <>
              <MetricRow
                label={tr({ es: 'Volumen', en: 'Volume' })}
                value={metrics.volume}
              />
              <MetricRow
                label={tr({ es: 'Dificultad', en: 'Difficulty' })}
                value={metrics.difficulty}
              />
              <MetricRow
                label={tr({ es: 'Intent', en: 'Intent' })}
                value={metrics.intent}
              />
              <MetricRow
                label={tr({ es: 'Oportunidad', en: 'Opportunity' })}
                value={metrics.opportunityScore}
                last
              />
            </>
          ) : (
            <span style={{ fontSize: '11px', color: mutedColor }}>
              {tr({
                es: 'Sin datos de métricas para esta keyword.',
                en: 'No metrics data for this keyword.',
              })}
            </span>
          )}
        </div>
      </div>

      {/* Checks */}
      <div style={{ fontSize: '11px', color: mutedColor }}>
        {locale === 'es' ? `Checks (${passCount}/7)` : `Checks (${passCount}/7)`}
      </div>

      {checks.length > 0 ? (
        checks.map((c) => (
          <div key={c.id} style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
            <span
              aria-label={`${tr(STATE_WORD[c.state])}: ${tr(c.label)}`}
              title={`${tr(STATE_WORD[c.state])}: ${tr(c.label)}`}
              style={{
                width: '18px',
                flexShrink: 0,
                color: statusColor(c.state),
                fontSize: '14px',
                lineHeight: 1.4,
                textAlign: 'center',
              }}
            >
              {GLYPH[c.state]}
            </span>
            <div style={{ fontSize: '13px', lineHeight: 1.4 }}>
              <div>{tr(c.label)}</div>
              {c.state !== 'green' && c.feedback ? (
                <div style={{ fontSize: '11px', color: mutedColor, marginTop: '2px' }}>
                  {tr(c.feedback)}
                </div>
              ) : null}
            </div>
          </div>
        ))
      ) : (
        <div
          style={{
            fontSize: '13px',
            fontStyle: 'italic',
            opacity: 0.7,
            marginTop: '8px',
            color: mutedColor,
          }}
        >
          {tr({ es: 'Calculando…', en: 'Calculating…' })}
        </div>
      )}

      {/* Recompute micro-state / timestamp */}
      {microText() ? (
        <div
          style={{
            fontSize: '11px',
            color: mutedColor,
            marginTop: '12px',
            fontStyle: !result && recomputing ? 'italic' : 'normal',
          }}
        >
          {microText()}
        </div>
      ) : null}
    </div>
  )
}

const MetricRow: React.FC<{
  label: string
  value?: string | number | null
  last?: boolean
}> = ({ label, value, last }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: '8px',
      marginBottom: last ? 0 : '8px',
    }}
  >
    <span style={{ fontSize: '11px', color: mutedColor }}>{label}</span>
    <span style={{ fontSize: '13px', fontWeight: 600, wordBreak: 'break-word', textAlign: 'right' }}>
      {value === null || value === undefined || value === '' ? '—' : value}
    </span>
  </div>
)

export default KeywordScorePanel
