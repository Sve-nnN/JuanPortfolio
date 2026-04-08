import type { Block } from 'payload'

export const ListingHero: Block = {
  slug: 'listingHero',
  interfaceName: 'ListingHeroBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      admin: {
        description: 'Título principal de la página de listado',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Descripción debajo del título',
      },
    },
    {
      name: 'breadcrumbs',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
          required: true,
        },
        {
          name: 'url',
          type: 'text',
        },
      ],
      admin: {
        description: 'Breadcrumbs (migas de pan) personalizados',
      },
    },
  ],
  labels: {
    singular: {
      en: 'Listing Hero',
      es: 'Hero de Listado',
    },
    plural: {
      en: 'Listing Heroes',
      es: 'Heroes de Listado',
    },
  },
}
