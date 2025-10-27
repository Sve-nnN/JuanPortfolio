import { redirect } from 'next/navigation'

interface PayloadRedirectsProps {
  url: string
  disableNotFound?: boolean
}

export const PayloadRedirects = ({ url, disableNotFound }: PayloadRedirectsProps) => {
  if (disableNotFound) {
    return null
  }
  redirect(url)
  return null
}

export default PayloadRedirects
