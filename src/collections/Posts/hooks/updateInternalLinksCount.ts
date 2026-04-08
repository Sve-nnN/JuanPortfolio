import type { CollectionBeforeChangeHook } from 'payload'
import { countInternalLinks } from '../../../utilities/lexicalCrawler'

export const updateInternalLinksCount: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
}) => {
  // Solo procesar si el contenido ha cambiado o es nuevo
  const content = data.content?.content || originalDoc?.content?.content

  if (content) {
    try {
      const linkCount = countInternalLinks(content)
      return {
        ...data,
        internalLinksCount: linkCount,
      }
    } catch (error) {
      console.error('Error al contar enlaces internos:', error)
    }
  }

  return data
}
