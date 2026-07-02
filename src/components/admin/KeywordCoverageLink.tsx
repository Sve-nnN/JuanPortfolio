'use client'
import React from 'react'
import Link from 'next/link'
import { useConfig, useTranslation } from '@payloadcms/ui'

export const KeywordCoverageLink: React.FC = () => {
  const { config } = useConfig()
  const adminPath = config.routes.admin
  // IN-03: follow the admin UI language instead of hardcoding Spanish.
  const { i18n } = useTranslation()
  const label = i18n.language?.startsWith('es') ? 'Cobertura de keywords' : 'Keyword coverage'

  return (
    <div style={{ padding: '0 15px', marginTop: '10px' }}>
      <Link
        href={`${adminPath}/keyword-coverage`}
        style={{
          textDecoration: 'none',
          color: 'var(--theme-text)',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
        {label}
      </Link>
    </div>
  )
}
