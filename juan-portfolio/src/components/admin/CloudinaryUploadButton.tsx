'use client'

import React, { useState } from 'react'
import { useFormFields } from '@payloadcms/ui'
import { useDocumentInfo } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'

export const CloudinaryUploadButton: React.FC = () => {
  const { id } = useDocumentInfo()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Get the current cloudinaryUrl field value
  const cloudinaryUrl = useFormFields(([fields]) => fields.cloudinaryUrl?.value)

  if (cloudinaryUrl) return null

  const handleUpload = async () => {
    setLoading(true)
    setMessage('Uploading...')

    try {
      const res = await fetch(`/api/media/${id}/upload-cloudinary`, {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setMessage('Uploaded successfully!')
        setTimeout(() => {
          router.refresh()
        }, 1000)
      } else {
        setMessage(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error(error)
      setMessage('Error triggering upload')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: '10px' }}>
      <button
        type="button"
        onClick={handleUpload}
        disabled={loading}
        className="btn btn--style-secondary btn--size-small"
        style={{ width: '100%' }}
      >
        {loading ? 'Uploading...' : 'Upload to Cloudinary'}
      </button>
      {message && (
        <div style={{ 
          marginTop: '5px', 
          fontSize: '0.8em', 
          color: message.includes('success') ? 'var(--theme-success-500)' : 'var(--theme-error-500)' 
        }}>
          {message}
        </div>
      )}
    </div>
  )
}
