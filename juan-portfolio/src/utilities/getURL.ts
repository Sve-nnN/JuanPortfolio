import canUseDOM from './canUseDOM'

export const getServerSideURL = () => {
  const raw =
    process.env.NEXT_PUBLIC_SERVER_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000')

  // In production, enforce https and strip www so all canonical/hreflang/schema URLs are canonical
  if (process.env.NODE_ENV === 'production' && !raw.includes('localhost')) {
    return raw.replace(/^http:\/\//, 'https://').replace(/^https:\/\/www\./, 'https://')
  }
  return raw
}

export const getClientSideURL = () => {
  if (process.env.NEXT_PUBLIC_SERVER_URL) {
    return process.env.NEXT_PUBLIC_SERVER_URL
  }

  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port

    return `${protocol}//${domain}${port ? `:${port}` : ''}`
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  return ''
}
