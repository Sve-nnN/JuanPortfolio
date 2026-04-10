import type { Block } from 'payload'

export const CaseStudiesGrid: Block = {
  slug: 'caseStudiesGrid',
  interfaceName: 'CaseStudiesGridBlock',
  fields: [
    {
      name: 'itemsPerPage',
      type: 'number',
      defaultValue: 12,
      min: 1,
      max: 24,
      admin: {
        description: 'Número de casos de estudio por página',
      },
    },
    {
      name: 'showCategories',
      type: 'checkbox',
      defaultValue: true,
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
        description: 'Mostrar extracto/descripción del caso',
      },
    },
    {
      name: 'showDate',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Mostrar fecha de publicación',
      },
    },
  ],
  labels: {
    singular: {
      en: 'Case Studies Grid',
      es: 'Grid de Casos de Estudio',
    },
    plural: {
      en: 'Case Studies Grids',
      es: 'Grids de Casos de Estudio',
    },
  },
}
