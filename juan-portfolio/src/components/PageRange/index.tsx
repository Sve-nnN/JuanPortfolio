import React from 'react'

const defaultLabels = {
  plural: { es: 'Documentos', en: 'Docs' },
  singular: { es: 'Documento', en: 'Doc' },
}

const defaultCollectionLabels = {
  posts: {
    plural: { es: 'Posts', en: 'Posts' },
    singular: { es: 'Post', en: 'Post' },
  },
}

export const PageRange: React.FC<{
  className?: string
  collection?: keyof typeof defaultCollectionLabels
  collectionLabels?: {
    plural?: string
    singular?: string
  }
  currentPage?: number
  limit?: number
  totalDocs?: number
  locale?: 'en' | 'es'
}> = (props) => {
  const {
    className,
    collection,
    collectionLabels: collectionLabelsFromProps,
    currentPage,
    limit,
    totalDocs,
    locale = 'es',
  } = props

  let indexStart = (currentPage ? currentPage - 1 : 1) * (limit || 1) + 1
  if (totalDocs && indexStart > totalDocs) indexStart = 0

  let indexEnd = (currentPage || 1) * (limit || 1)
  if (totalDocs && indexEnd > totalDocs) indexEnd = totalDocs

  const labels = collectionLabelsFromProps ||
    (collection ? defaultCollectionLabels[collection] : undefined) ||
    defaultLabels

  const plural = typeof labels.plural === 'string' ? labels.plural : (labels.plural?.[locale] || 'Docs')
  const singular = typeof labels.singular === 'string' ? labels.singular : (labels.singular?.[locale] || 'Doc')

  return (
    <div className={[className, 'font-semibold'].filter(Boolean).join(' ')}>
      {(typeof totalDocs === 'undefined' || totalDocs === 0) && (locale === 'es' ? 'La búsqueda no produjo resultados.' : 'Search produced no results.')}
      {typeof totalDocs !== 'undefined' &&
        totalDocs > 0 &&
        (locale === 'es' 
          ? `Mostrando ${indexStart}${indexStart > 0 ? ` - ${indexEnd}` : ''} de ${totalDocs} ${totalDocs > 1 ? plural : singular}`
          : `Showing ${indexStart}${indexStart > 0 ? ` - ${indexEnd}` : ''} of ${totalDocs} ${totalDocs > 1 ? plural : singular}`
        )}
    </div>
  )
}
