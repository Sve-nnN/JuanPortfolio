import type { Field } from 'payload'

interface SEOFieldsConfig {
  defaults?: {
    title?: string
    description?: string
    ogImage?: string
  }
  jsonLd?: boolean
}

export const seoFields = ({ defaults = {}, jsonLd = true }: SEOFieldsConfig = {}): Field[] => {
  const fields: Field[] = [
    {
      name: 'meta',
      type: 'group',
      label: { en: 'Meta Tags', es: 'Etiquetas Meta' },
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
          label: { en: 'Meta Title', es: 'Título Meta' },
          maxLength: 60,
          defaultValue: defaults.title,
        },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
          label: { en: 'Meta Description', es: 'Descripción Meta' },
          maxLength: 160,
          defaultValue: defaults.description,
        },
        {
          name: 'keywords',
          type: 'text',
          label: { en: 'Focus Keywords', es: 'Palabras Clave' },
        },
      ],
    },
    {
      name: 'canonical',
      type: 'text',
      label: { en: 'Canonical URL', es: 'URL Canónica' },
    },
    {
      name: 'noindex',
      type: 'checkbox',
      label: { en: 'No Index', es: 'No Indexar' },
      defaultValue: false,
    },
    {
      name: 'nofollow',
      type: 'checkbox',
      label: { en: 'No Follow', es: 'No Seguir' },
      defaultValue: false,
    },
    {
      name: 'og',
      type: 'group',
      label: { en: 'Open Graph', es: 'Open Graph' },
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
          label: { en: 'OG Title', es: 'Título OG' },
        },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
          label: { en: 'OG Description', es: 'Descripción OG' },
        },
        {
          name: 'image',
          type: 'upload',
          label: { en: 'OG Image', es: 'Imagen OG' },
          relationTo: 'media',
        },
        {
          name: 'type',
          type: 'select',
          label: { en: 'OG Type', es: 'Tipo OG' },
          defaultValue: 'website',
          options: [
            { label: 'Website', value: 'website' },
            { label: 'Article', value: 'article' },
          ],
        },
      ],
    },
    {
      name: 'twitter',
      type: 'group',
      label: { en: 'Twitter Card', es: 'Twitter Card' },
      fields: [
        {
          name: 'card',
          type: 'select',
          label: { en: 'Card Type', es: 'Tipo' },
          defaultValue: 'summary_large_image',
          options: [
            { label: 'Summary', value: 'summary' },
            { label: 'Large', value: 'summary_large_image' },
          ],
        },
        {
          name: 'title',
          type: 'text',
          localized: true,
          label: { en: 'Twitter Title', es: 'Título' },
        },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
          label: { en: 'Twitter Description', es: 'Descripción' },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: { en: 'Twitter Image', es: 'Imagen' },
        },
      ],
    },
    {
      name: 'seoScore',
      type: 'number',
      label: { en: 'SEO Score', es: 'Puntuación SEO' },
      admin: { readOnly: true },
    },
    {
      name: 'seoAnalysis',
      type: 'json',
      label: { en: 'SEO Analysis', es: 'Análisis SEO' },
      admin: { readOnly: true },
    },
  ]

  if (jsonLd) {
    fields.push({
      name: 'schema',
      type: 'group',
      label: { en: 'Schema', es: 'Schema' },
      fields: [
        {
          name: 'type',
          type: 'select',
          label: { en: 'Type', es: 'Tipo' },
          defaultValue: 'WebPage',
          options: [
            { label: 'WebPage', value: 'WebPage' },
            { label: 'Article', value: 'Article' },
          ],
        },
      ],
    })
  }

  return fields
}
