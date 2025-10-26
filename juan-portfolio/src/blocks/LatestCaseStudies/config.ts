import type { Block } from 'payload'

export const LatestCaseStudies: Block = {
  slug: 'latestCaseStudies',
  interfaceName: 'LatestCaseStudiesBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Título',
      required: false,
      defaultValue: 'Últimos casos de estudio',
    },
    {
      name: 'count',
      type: 'number',
      label: 'Cantidad de casos',
      required: false,
      defaultValue: 3,
      min: 1,
      max: 12,
    },
  ],
}

export default LatestCaseStudies
