import React from 'react'

// Detect collection and build live URL automatically

interface LiveUrlLinkProps {
  data?: {
    slug?: string | null
  }
  path?: string
}

const LiveUrlLink: React.FC<LiveUrlLinkProps> = (props) => {
  const slug = props?.data?.slug
  // Detect collection from path or field context
  const collection = props?.path?.includes('categories')
    ? 'categories'
    : props?.path?.includes('authors')
      ? 'authors'
      : props?.path?.includes('users')
        ? 'users'
        : undefined

  let basePath = ''
  if (collection === 'categories') basePath = '/blog/'
  // Both the new Authors collection and the legacy users profile map to /authors/
  // (users kept as fallback until Phase 58). Additive, non-destructive.
  if (collection === 'authors') basePath = '/authors/'
  if (collection === 'users') basePath = '/authors/'
  if (!slug || !basePath) return null
  const url = `${basePath}${slug}`
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'block', margin: '1em 0', color: '#0070f3', fontWeight: 600 }}
    >
      Ver página pública
    </a>
  )
}

export default LiveUrlLink
