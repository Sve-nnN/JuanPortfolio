import type { Block } from 'payload'

export const FeaturedBlog: Block = {
  slug: 'featuredBlog',
  interfaceName: 'FeaturedBlogBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description: 'Título de la sección de blog',
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
      name: 'posts',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      admin: {
        description: 'Selecciona posts específicos o déjalo vacío para mostrar los más recientes',
      },
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 12,
      admin: {
        description: 'Número de posts a mostrar',
      },
    },
    {
      name: 'ctaLabel',
      type: 'text',
      localized: true,
      admin: {
        description: 'Texto del botón CTA',
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
      en: 'Featured Blog',
      es: 'Blog Destacado',
    },
    plural: {
      en: 'Featured Blogs',
      es: 'Blogs Destacados',
    },
  },
}
