import React from 'react'
import type { Schema } from '@/utilities/schema'

interface JsonLdProps {
  schema: Schema | Schema[] | null | undefined
}

export const JsonLd = ({ schema }: JsonLdProps) => {
  if (!schema) return null

  const schemaData = Array.isArray(schema)
    ? {
        '@context': 'https://schema.org',
        '@graph': schema.filter(s => s != null),
      }
    : schema

  if (Array.isArray(schema) && schema.filter(s => s != null).length === 0) {
    return null
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  )
}
