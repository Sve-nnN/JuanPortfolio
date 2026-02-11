'use client'
import React from 'react'
import Link from 'next/link'
import { useConfig } from '@payloadcms/ui'

export const GSCDashboardLink: React.FC = () => {
  const { config } = useConfig()
  const adminPath = config.routes.admin

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
          gap: '10px'
        }}
      >
        <span style={{ fontSize: '18px' }}>📈</span>
        GSC Dashboard
      </Link>
    </div>
  )
}
