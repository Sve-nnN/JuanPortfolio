export const formatDateTime = (timestamp: string, locale: 'en' | 'es' = 'es'): string => {
  const date = timestamp ? new Date(timestamp) : new Date()
  
  return date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
