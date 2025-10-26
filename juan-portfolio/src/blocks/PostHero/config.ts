import type { Block } from 'payload'

export const PostHeroBlock: Block = {
  slug: 'postHero',
  interfaceName: 'PostHeroBlock',
  fields: [
    {
      name: 'showHero',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Mostrar u ocultar el hero del post',
      },
    },
    {
      name: 'showImage',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Mostrar la imagen destacada del post',
      },
    },
    {
      name: 'showMeta',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Mostrar metadata (fecha, autor, tiempo de lectura)',
      },
    },
    {
      name: 'showCategories',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Mostrar categorías del post',
      },
    },
    {
      name: 'heroStyle',
      type: 'select',
      defaultValue: 'full-width',
      options: [
        { label: 'Ancho completo', value: 'full-width' },
        { label: 'Contenedor', value: 'contained' },
      ],
      admin: {
        description: 'Estilo del hero',
      },
    },
  ],
  labels: {
    singular: {
      en: 'Post Hero',
      es: 'Hero de Post',
    },
    plural: {
      en: 'Post Heroes',
      es: 'Heroes de Post',
    },
  },
}
