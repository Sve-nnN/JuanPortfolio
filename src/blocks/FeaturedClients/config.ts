import type { Block } from 'payload'

export const FeaturedClients: Block = {
  slug: 'featuredClients',
  interfaceName: 'FeaturedClientsBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description: 'Título de la sección de clientes',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Breve texto explicando la relación con los clientes (opcional)',
      },
    },
    {
      name: 'clients',
      type: 'relationship',
      relationTo: 'clientes',
      hasMany: true,
      admin: {
        description: 'Selecciona los clientes destacados',
      },
    },
    {
      name: 'autoScroll',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Activar scroll automático del carrusel',
      },
    },
    {
      name: 'ctaLabel',
      type: 'text',
      localized: true,
    },
    {
      name: 'ctaUrl',
      type: 'text',
    },
  ],
  labels: {
    singular: {
      en: 'Featured Clients',
      es: 'Clientes Destacados',
    },
    plural: {
      en: 'Featured Clients',
      es: 'Clientes Destacados',
    },
  },
}
