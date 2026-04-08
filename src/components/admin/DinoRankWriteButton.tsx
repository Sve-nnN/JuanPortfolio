'use client'

import React, { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'

type PrimaryKeywordValue =
  | string
  | {
      keyword?: string | null
      title?: string | null
      value?: string | null
      slug?: string | null
    }

export const DinoRankWriteButton: React.FC = () => {
  const { id, initialData } = useDocumentInfo()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const primaryKeyword = initialData?.primaryKeyword as PrimaryKeywordValue | undefined
  const keywordFromPrimary =
    typeof primaryKeyword === 'string'
      ? primaryKeyword
      : primaryKeyword?.keyword ?? primaryKeyword?.title ?? primaryKeyword?.value ?? primaryKeyword?.slug ?? ''
  const fallbackKeyword = typeof initialData?.title === 'string' ? initialData.title : ''
  const keyword = (keywordFromPrimary || fallbackKeyword).trim()

  const handleWrite = async () => {
    if (!keyword) {
      setMessage('Save the post title or primary keyword first.')
      return
    }

    setLoading(true)
    setMessage('Starting DinoRank generation...')

    try {
      const res = await fetch('/api/dinorank/redactar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          keyword,
        }),
      })

      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string }

      if (!res.ok) {
        throw new Error(data.error || 'Unable to start generation')
      }

      setMessage(data.message || 'DinoRank generation started.')
      router.refresh()

      setTimeout(() => setMessage(''), 4000)
    } catch (error) {
      console.error(error)
      setMessage(error instanceof Error ? error.message : 'Error starting DinoRank generation')
    } finally {
      setLoading(false)
    }
  }

  if (!id) return null

  return (
    <div className="field-type custom-field" style={{ marginBottom: '2rem' }}>
      <label className="field-label">DinoRank</label>

      <button
        type="button"
        onClick={handleWrite}
        disabled={loading || !keyword}
        className="btn btn--style-secondary btn--size-small"
        style={{ width: '100%', opacity: loading || !keyword ? 0.7 : 1 }}
      >
        {loading ? 'Redacting...' : 'Redactar con DinoRank'}
      </button>

      <div style={{ marginTop: '8px', fontSize: '0.85em', color: 'var(--theme-elevation-500)' }}>
        {keyword ? `Usará: ${keyword}` : 'Save a title or primary keyword to enable DinoRank.'}
      </div>

      {message ? (
        <div style={{ marginTop: '8px', fontSize: '0.85em', color: 'var(--theme-elevation-700)' }}>
          {message}
        </div>
      ) : null}
    </div>
  )
}