import type { Block } from 'payload'

export const TestimonialSection: Block = {
  slug: 'testimonialSection',
  interfaceName: 'TestimonialSectionBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description: 'Título de la sección (ej: "Testimonio del Cliente")',
      },
    },
    {
      name: 'quote',
      type: 'textarea',
      required: true,
      localized: true,
      admin: {
        description: 'Cita textual del testimonio',
      },
    },
    {
      name: 'authorName',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'Nombre del autor del testimonio',
      },
    },
    {
      name: 'authorRole',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'Cargo y empresa del autor (ej: "CEO, Moda-Vanguardia")',
      },
    },
    {
      name: 'authorImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Foto del autor del testimonio',
      },
    },
  ],
}
