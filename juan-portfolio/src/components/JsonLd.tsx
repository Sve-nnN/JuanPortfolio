import React from 'react'

export const JsonLd = ({ schema }: { schema: unknown }) => {
    if (!schema) return null

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    )
}
