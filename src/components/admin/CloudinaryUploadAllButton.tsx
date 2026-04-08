'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export const CloudinaryUploadAllButton: React.FC = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleUploadAll = async () => {
    if (!confirm('This will attempt to upload all images missing a Cloudinary URL (limit 100). Continue?')) {
      return
    }

    setLoading(true)
    setMessage('Processing...')

    try {
      const res = await fetch(`/api/media/upload-all-cloudinary`, {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`Finished: ${data.success} success, ${data.failed} failed.`)
        setTimeout(() => {
          router.refresh()
          setLoading(false)
          setMessage('')
        }, 3000)
      } else {
        setMessage(data.error || 'Process failed')
        setLoading(false)
      }
    } catch (error) {
      console.error(error)
      setMessage('Error triggering process')
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'inline-block', marginRight: '10px', marginBottom: '10px' }}>
      <button
        type="button"
        onClick={handleUploadAll}
        disabled={loading}
        className="btn btn--style-secondary btn--size-small"
      >
        {loading ? 'Processing...' : 'Upload All Missing to Cloudinary'}
      </button>
      {message && (
        <span style={{ 
          marginLeft: '10px', 
          fontSize: '0.9em', 
          color: message.includes('failed') && !message.includes('0 failed') ? 'var(--theme-error-500)' : 'var(--theme-success-500)' 
        }}>
          {message}
        </span>
      )}
    </div>
  )
}
