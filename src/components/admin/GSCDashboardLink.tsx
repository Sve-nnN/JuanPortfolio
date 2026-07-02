'use client'
import React from 'react'
import Link from 'next/link'
import { useConfig, useTranslation } from '@payloadcms/ui'

export const GSCDashboardLink: React.FC = () => {
  const { config } = useConfig()
  const adminPath = config.routes.admin
  // IN-03: follow the admin UI language instead of hardcoding English.
  const { i18n } = useTranslation()
  const label = i18n.language?.startsWith('es') ? 'Panel GSC' : 'GSC Dashboard'

  return (
    <div style={{ padding: '0 15px', marginTop: '10px' }}>
      <Link
        href={`${adminPath}/gsc-dashboard`}
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
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        {label}
      </Link>
    </div>
  )
}
