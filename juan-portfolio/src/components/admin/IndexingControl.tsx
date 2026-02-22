'use client'

import React, { useState } from 'react'
import { useForm, useDocumentInfo } from '@payloadcms/ui'
import { Button } from '@payloadcms/ui/elements/Button'
import { toast } from '@payloadcms/ui'

export const IndexingControl: React.FC = () => {
  const { getFields } = useForm()
  const { id, collectionSlug } = useDocumentInfo()
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [loadingRequest, setLoadingRequest] = useState(false)
  const [statusResult, setStatusResult] = useState<any>(null)
  const [isMounted, setIsMounted] = useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const [currentUrl, setCurrentUrl] = useState<string>('')

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  React.useEffect(() => {
    if (!isMounted || !id || !collectionSlug) return

    let isCancelled = false
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://juan-tech.com'

    const resolveUrl = async () => {
      let path = ''
      try {
        const res = await fetch(`/api/${collectionSlug}/${id}?depth=1`)
        if (res.ok) {
          const data = await res.json()
          const savedSlug = data.slug || ''

          if (collectionSlug === 'pages') path = `/${savedSlug}`
          else if (collectionSlug === 'categories') path = `/blog/category/${savedSlug}`
          else if (collectionSlug === 'posts') {
            let categorySlug = 'uncategorized'
            if (
              data?.categories?.length > 0 &&
              typeof data.categories[0] === 'object' &&
              data.categories[0].slug
            ) {
              categorySlug = data.categories[0].slug
            }
            path = `/blog/${categorySlug}/${savedSlug}`
          }
        }
      } catch (e) {
        console.error('Error fetching document data', e)
      }

      if (!isCancelled && path) {
        setCurrentUrl(`${baseUrl}${path}`.replace(/(https?:\/\/)|(\/)+/g, '$1$2'))
      }
    }

    resolveUrl()

    return () => {
      isCancelled = true
    }
  }, [isMounted, id, collectionSlug])

  const handleCheckStatus = async () => {
    if (!currentUrl) {
      toast.error('Cannot determine URL. Ensure document is saved.')
      return
    }

    setLoadingStatus(true)
    setStatusResult(null)
    try {
      const response = await fetch('/api/seo/indexing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', url: currentUrl, collection: collectionSlug, id }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStatusResult(data.status)
        toast.success('Estado obtenido correctamente')
      } else {
        toast.error(data.error || 'Error al verificar el estado')
      }
    } catch (error) {
      toast.error('Error de red al verificar estado')
    } finally {
      setLoadingStatus(false)
    }
  }

  const handleRequestIndexing = async () => {
    if (!currentUrl) {
      toast.error('Cannot determine URL. Ensure document is saved.')
      return
    }

    setLoadingRequest(true)
    try {
      const response = await fetch('/api/seo/indexing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request',
          url: currentUrl,
          collection: collectionSlug,
          id,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const h = data.results

        if (h.google.success && h.bing.success) {
          toast.success('¡Solicitud enviada a Google y Bing!')
        } else if (h.google.success) {
          toast.success('Solicitud enviada a Google. Error en Bing.')
        } else if (h.bing.success) {
          toast.success('Solicitud enviada a Bing. Error en Google.')
        } else {
          toast.error('Falló la solicitud en ambos buscadores.')
        }
      } else {
        toast.error(data.error || 'Error al solicitar indexación')
      }
    } catch (error) {
      toast.error('Error de red al solicitar indexación')
    } finally {
      setLoadingRequest(false)
    }
  }

  return (
    <div className="field-type custom-field" style={{ marginBottom: '2rem' }}>
      <label className="field-label">Indexing Tools</label>

      <div
        style={{
          fontSize: '13px',
          marginBottom: '15px',
          color: 'var(--theme-elevation-400)',
          wordBreak: 'break-all',
        }}
      >
        <strong>URL:</strong>{' '}
        {!id ? (
          <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Please save the document first</span>
        ) : !isMounted || !currentUrl ? (
          <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Loading URL...</span>
        ) : (
          <a href={currentUrl} target="_blank" rel="noopener noreferrer">
            {currentUrl}
          </a>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <Button
          onClick={handleCheckStatus}
          disabled={!id || !isMounted || !currentUrl || loadingStatus || loadingRequest}
          buttonStyle="secondary"
          size="small"
        >
          {loadingStatus ? 'Checking...' : 'Check Status'}
        </Button>

        <Button
          onClick={handleRequestIndexing}
          disabled={!id || !isMounted || !currentUrl || loadingStatus || loadingRequest}
          buttonStyle="primary"
          size="small"
        >
          {loadingRequest ? 'Requesting...' : 'Request Indexing'}
        </Button>
      </div>

      {statusResult ? (
        <div
          style={{
            padding: '10px',
            backgroundColor: 'var(--theme-elevation-50)',
            borderRadius: '4px',
            fontSize: '13px',
          }}
        >
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Google Index Status</h4>
          <p style={{ margin: '0 0 5px 0' }}>
            <strong>Coverage:</strong> {statusResult?.indexStatusResult?.coverageState || 'Unknown'}
          </p>
          <p style={{ margin: '0 0 5px 0' }}>
            <strong>Last Crawl:</strong>{' '}
            {statusResult?.indexStatusResult?.lastCrawlTime
              ? new Date(statusResult.indexStatusResult.lastCrawlTime).toLocaleString()
              : 'N/A'}
          </p>
          <p style={{ margin: '0' }}>
            <strong>Mobile Usability:</strong>{' '}
            {statusResult?.mobileUsabilityResult?.verdict || 'Unknown'}
          </p>
        </div>
      ) : null}
    </div>
  )
}
