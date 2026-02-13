'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export const ScanAllButton: React.FC = () => {
  const _router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [message, setMessage] = useState('')

  const handleScanAll = async () => {
    if (
      confirm(
        "This will trigger a background scan for all pages that haven't been scanned in the last 7 days. Continue?",
      )
    ) {
      setScanning(true)
      setMessage('Starting background scan...')

      try {
        // Fire and forget - the process might take a while
        fetch(`/api/page-metrics/scan-all`, {
          method: 'POST',
        }).then((res) => {
          if (res.ok) setMessage('Scan started in background.')
          else setMessage('Failed to start scan.')
        })

        // Clear message after a bit
        setTimeout(() => {
          setScanning(false)
          setMessage('')
        }, 5000)
      } catch (error) {
        console.error(error)
        setMessage('Error starting scan')
        setScanning(false)
      }
    }
  }

  return (
    <div className="scan-all-wrapper" style={{ display: 'inline-block', marginRight: '10px' }}>
      <button
        type="button"
        onClick={handleScanAll}
        disabled={scanning}
        className="btn btn--style-secondary btn--size-small"
        style={{ opacity: scanning ? 0.7 : 1 }}
      >
        {scanning ? 'Scanning...' : 'Scan All Missing'}
      </button>
      {message && (
        <span style={{ marginLeft: '10px', fontSize: '0.9em', color: 'var(--theme-success-500)' }}>
          {message}
        </span>
      )}
    </div>
  )
}
