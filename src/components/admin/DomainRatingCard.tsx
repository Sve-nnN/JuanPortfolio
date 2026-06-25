'use client'
import React, { useEffect, useState } from 'react'
import { useConfig } from '@payloadcms/ui'

/**
 * Admin dashboard widget showing the site's Ahrefs Domain Rating.
 *
 * Data comes from /api/domain-rating, which hits Ahrefs' free public endpoint
 * at most once every 24h (server-side cache). The "Domain Rating by Ahrefs"
 * attribution link is required by the Domain Rating License. Renders nothing
 * disruptive on failure — the dashboard never breaks. MONITOR-01/03.
 */

interface DomainRatingResponse {
  ok: boolean
  target?: string
  domainRating?: number
  license?: string
  fetchedAt?: string
}

export const DomainRatingCard: React.FC = () => {
  const [data, setData] = useState<DomainRatingResponse | null>(null)
  const [loaded, setLoaded] = useState(false)
  const { config } = useConfig()
  const serverURL = config.serverURL

  useEffect(() => {
    let active = true
    fetch(`${serverURL}/api/domain-rating`)
      .then((r) => r.json())
      .then((json) => {
        if (active) setData(json)
      })
      .catch(() => {
        if (active) setData({ ok: false })
      })
      .finally(() => {
        if (active) setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [serverURL])

  if (!loaded) return null

  const hasValue = data?.ok && typeof data.domainRating === 'number'
  const license = data?.license || 'https://ahrefs.com/legal/domain-rating-license'
  const fetchedLabel = data?.fetchedAt
    ? new Date(data.fetchedAt).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: 'var(--theme-bg)',
        borderRadius: '8px',
        border: '1px solid var(--theme-border-color)',
        marginBottom: '30px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
      }}
    >
      <div style={{ flex: '0 0 auto' }}>
        <h4 style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          Domain Rating{data?.target ? ` · ${data.target}` : ''}
        </h4>
        <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#f7700a', lineHeight: 1.1 }}>
          {hasValue ? data!.domainRating!.toFixed(0) : '—'}
        </div>
        {hasValue && fetchedLabel ? (
          <div style={{ fontSize: '11px', color: '#999' }}>Actualizado: {fetchedLabel}</div>
        ) : (
          <div style={{ fontSize: '11px', color: '#999' }}>
            {hasValue ? '' : 'No disponible ahora mismo'}
          </div>
        )}
      </div>
      <div style={{ flex: '1 1 auto' }} />
      <div style={{ flex: '0 0 auto', fontSize: '11px', color: '#999' }}>
        {/* Required attribution per the Ahrefs Domain Rating License. */}
        <a
          href={license}
          target="_blank"
          rel="noopener noreferrer nofollow"
          style={{ color: '#999', textDecoration: 'underline' }}
        >
          Domain Rating by Ahrefs
        </a>
      </div>
    </div>
  )
}
