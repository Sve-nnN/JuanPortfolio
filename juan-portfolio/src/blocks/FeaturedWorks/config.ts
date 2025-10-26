import type { Block } from 'payload'

export const FeaturedWorks: Block = {
  slug: 'featuredWorks',
  interfaceName: 'FeaturedWorksBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description: 'Título de la sección (ej: "Proyectos Destacados")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Descripción de la sección',
      },
    },
    {
      name: 'works',
      type: 'relationship',
      relationTo: 'case-studies',
      hasMany: true,
      admin: {
        description: 'Selecciona los casos de estudio destacados',
      },
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 6,
      min: 1,
      max: 12,
      admin: {
        description: 'Número máximo de trabajos a mostrar',
      },
    },
    {
      name: 'ctaLabel',
      type: 'text',
      localized: true,
      admin: {
        description: 'Texto del botón CTA (ej: "Ver todos los proyectos")',
      },
    },
    {
      name: 'ctaUrl',
      type: 'text',
      admin: {
        description: 'URL del botón CTA',
      },
    },
  ],
  labels: {
    singular: {
      en: 'Featured Works',
      es: 'Trabajos Destacados',
    },
    plural: {
      en: 'Featured Works',
      es: 'Trabajos Destacados',
    },
  },
}
