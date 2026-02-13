'use client'
import React, { useEffect, useState } from 'react'
import { useConfig } from '@payloadcms/ui'

interface RowData {
  slug?: string
}

interface FieldConfig {
  custom?: {
    collection?: string
  }
}

export const GSCCell: React.FC<{ rowData: RowData; field: FieldConfig }> = ({ rowData, field }) => {
  const [clicks, setClicks] = useState<number | null>(null)
  const { config } = useConfig()
  const serverURL = config.serverURL

  useEffect(() => {
    const fetchClicks = async () => {
      const slug = rowData.slug
      const collection = field.custom?.collection || 'pages'
      
      let path = ''
      if (collection === 'posts') {
        path = `/blog/${slug}`
      } else if (collection === 'pages') {
        path = slug === 'home' ? '/' : `/${slug}`
      } else {
        path = `/${slug}`
      }

      try {
        const gscPropertyUrl = (process.env.NEXT_PUBLIC_GSC_PROPERTY_URL || '').replace(/\/$/, '')
        const cleanPath = path.startsWith('/') ? path : `/${path}`
        const fullUrl = `${gscPropertyUrl}${cleanPath}`

        const response = await fetch(
          `${serverURL}/api/gsc-metrics?where[page][equals]=${encodeURIComponent(fullUrl)}&sort=-date&limit=1`,
        )
        const json = await response.json()
        if (json.docs && json.docs.length > 0) {
          setClicks(json.docs[0].clicks)
        }
      } catch (error) {
        console.error('Error fetching GSC cell data:', error)
      }
    }

    if (rowData?.slug) {
      fetchClicks()
    }
  }, [rowData, field, serverURL])

  if (clicks === null) return <span>-</span>
  return <span title="Clicks from GSC (latest sync)">{clicks}</span>
}
