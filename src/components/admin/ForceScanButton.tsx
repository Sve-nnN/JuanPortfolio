'use client'

import React, { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'

export const ForceScanButton: React.FC = () => {
  const { id } = useDocumentInfo()
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [message, setMessage] = useState('')

  const handleScan = async () => {
    if (!id) return
    setScanning(true)
    setMessage('Scanning...')

    try {
      const res = await fetch(`/api/page-metrics/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (!res.ok) throw new Error('Scan failed')

      setMessage('Done!')
      router.refresh()

      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error(error)
      setMessage('Error')
    } finally {
      setScanning(false)
    }
  }

  if (!id) return null

  return (
    <div className="field-type">
      <label className="field-label">Actions</label>
      <button
        type="button"
        onClick={handleScan}
        disabled={scanning}
        className="btn btn--style-secondary btn--size-small"
        style={{ opacity: scanning ? 0.7 : 1 }}
      >
        {scanning ? 'Scanning...' : 'Force Scan Now'}
      </button>
      {message && <span style={{ marginLeft: '10px', fontSize: '0.9em' }}>{message}</span>}
    </div>
  )
}
