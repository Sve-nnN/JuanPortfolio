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
      name: 'clients',
      type: 'relationship',
      relationTo: 'clients',
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
