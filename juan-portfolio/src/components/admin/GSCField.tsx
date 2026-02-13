'use client'
import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { GSCPerformanceView } from './GSCPerformanceView'

export const GSCField: React.FC = () => {
  const { docConfig, id: _id, initialData } = useDocumentInfo()
  
  if (!initialData || !initialData.slug) {
    return <div>Please save the document first to see GSC data.</div>
  }

  // Construct path based on collection
  let path = ''
  if (docConfig?.slug === 'posts') {
    path = `/blog/${initialData.slug}`
  } else if (docConfig?.slug === 'pages') {
    path = initialData.slug === 'home' ? '/' : `/${initialData.slug}`
  } else {
    path = `/${initialData.slug}`
  }

  return <GSCPerformanceView path={path} />
}
