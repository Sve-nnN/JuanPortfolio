import { redirect, notFound } from 'next/navigation'

interface PayloadRedirectsProps {
  url: string
  disableNotFound?: boolean
}

export const PayloadRedirects = ({ url, disableNotFound }: PayloadRedirectsProps) => {
  if (disableNotFound) {
    return null
  }

  // Prevent redirecting to the same path to avoid infinite loops
  if (typeof window !== 'undefined' && window.location.pathname === url) {
    return notFound()
  }

  redirect(url)
  return null
}

export default PayloadRedirects
