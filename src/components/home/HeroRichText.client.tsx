"use client"
import React, { useEffect, useState } from 'react'
import RichText from '@/components/RichText'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

type Props = {
  data: DefaultTypedEditorState
  skipFirstNodes?: number
}

export default function HeroRichText({ data, skipFirstNodes }: Props) {
  // Avoid rendering the full RichText during SSR. Show a small skeleton/fallback
  // and render the heavy RichText only after the component is mounted on client.
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Server-side and initial client render fallback: simple paragraph(s) extracted
    // from the minimal lexical structure if available, otherwise a generic placeholder.
    try {
      const root = (data as Record<string, unknown>)?.root as Record<string, unknown> | undefined
      const children = Array.isArray(root?.children) ? (root?.children as unknown[]) : []
      const firstParagraphNode = children.find((c) => (c as Record<string, unknown>)?.type === 'paragraph') as
        | Record<string, unknown>
        | undefined
      const text = firstParagraphNode && Array.isArray(firstParagraphNode.children)
        ? (firstParagraphNode.children as unknown[]).map((x) => (x as Record<string, unknown>)?.['text'] || '').join('')
        : ''

      return (
        <div className="prose max-w-xl mb-6">
          {text ? <p>{text}</p> : <p className="text-muted">&nbsp;</p>}
        </div>
      )
    } catch (_e) {
      return (
        <div className="prose max-w-xl mb-6">
          <p className="text-muted">&nbsp;</p>
        </div>
      )
    }
  }

  // If skipFirstNodes is provided, remove those top-level nodes before rendering
  let renderData: DefaultTypedEditorState = data
  try {
    if (mounted && typeof skipFirstNodes === 'number' && data?.root && Array.isArray(data.root.children)) {
      const root = { ...data.root }
      root.children = (root.children || []).slice(skipFirstNodes)
      renderData = { ...data, root }
    }
  } catch (_err) {
    // ignore and render original data
  }

  return (
    <div className="prose max-w-xl mb-6">
      <RichText data={renderData} />
    </div>
  )
}
