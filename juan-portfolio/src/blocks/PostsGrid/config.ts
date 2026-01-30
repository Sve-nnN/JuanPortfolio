import type { Block } from 'payload'

import { animationField } from '@/fields/animation'

export const PostsGrid: Block = {
  slug: 'postsGrid',
  interfaceName: 'PostsGridBlock',
  fields: [
    {
      name: 'postsPerPage',
      type: 'number',
      defaultValue: 12,
      min: 1,
      max: 24,
      admin: {
        description: 'Número de posts por página',
      },
    },
    {
      name: 'showCategories',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Mostrar filtros de categorías',
      },
    },
    {
      name: 'gridColumns',
      type: 'select',
      defaultValue: '3',
      options: [
        { label: '2 columnas', value: '2' },
        { label: '3 columnas', value: '3' },
        { label: '4 columnas', value: '4' },
      ],
      admin: {
        description: 'Número de columnas en el grid (desktop)',
      },
    },
    {
      name: 'showExcerpt',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Mostrar extracto/descripción del post',
      },
    },
    {
      name: 'showDate',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Mostrar fecha de publicación',
      },
    },
    animationField(),
  ],
  labels: {
    singular: {
      en: 'Posts Grid',
      es: 'Grid de Posts',
    },
    plural: {
      en: 'Posts Grids',
      es: 'Grids de Posts',
    },
  },
}
