import type { CollectionConfig } from 'payload'

export const BrokenLinks: CollectionConfig = {
  slug: 'broken-links',
  labels: {
    singular: { en: 'Broken Link', es: 'Enlace Roto' },
    plural: { en: 'Broken Links', es: 'Enlaces Rotos' },
  },
  admin: {
    useAsTitle: 'url',
    defaultColumns: ['url', 'statusCode', 'sourcePage', 'lastChecked'],
    group: 'SEO',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'url',
      type: 'text',
      label: 'URL del Enlace Roto',
      required: true,
    },
    {
      name: 'statusCode',
      type: 'number',
      label: 'Código de Estado',
    },
    {
      name: 'statusText',
      type: 'text',
      label: 'Mensaje de Error',
    },
    {
      name: 'sourcePage',
      type: 'text',
      label: 'Página de Origen',
      admin: {
        description: 'Página donde se encontró el enlace roto',
      },
    },
    {
      name: 'lastChecked',
      type: 'date',
      label: 'Última Verificación',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
