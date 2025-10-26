import type { Block } from 'payload'

export const FeaturedCaseStudies: Block = {
  slug: 'featuredCaseStudies',
  interfaceName: 'FeaturedCaseStudiesBlock',
  labels: {
    singular: 'Featured Case Studies',
    plural: 'Featured Case Studies',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Section Title',
      defaultValue: 'Casos de Estudio',
      localized: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Section Description',
      defaultValue: 'Una selección de mis trabajos más recientes.',
      localized: true,
    },
    {
      name: 'caseStudies',
      type: 'relationship',
      relationTo: 'case-studies',
      hasMany: true,
      maxRows: 6,
      label: 'Featured Case Studies',
      admin: {
        description: 'Select case studies to feature',
      },
    },
    {
      name: 'ctaText',
      type: 'text',
      label: 'CTA Button Text',
      defaultValue: 'Ver todos los casos de estudio',
      localized: true,
    },
    {
      name: 'ctaLink',
      type: 'text',
      label: 'CTA Button Link',
      defaultValue: '/casos-de-estudio',
    },
  ],
}
