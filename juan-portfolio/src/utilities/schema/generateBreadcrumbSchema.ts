import type { BreadcrumbItem, Schema } from './types'

export function generateBreadcrumbSchema(items: BreadcrumbItem[]): Schema | null {
  if (!items || items.length === 0) {
    return null
  }

  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || ''

  const itemListElement = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  }
}
