import type { Block } from 'payload'

export const CaseStudyHeader: Block = {
  slug: 'caseStudyHeader',
  interfaceName: 'CaseStudyHeaderBlock',
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
      admin: {
        description: 'Texto pequeño sobre el título (ej: "Caso de Estudio de E-commerce")',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'Título principal del caso de estudio',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Descripción breve del caso de estudio',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Imagen principal del caso de estudio',
      },
    },
    {
      name: 'projectInfo',
      type: 'array',
      minRows: 1,
      maxRows: 8,
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'Etiqueta (ej: "Cliente", "Servicios", "Duración")',
          },
        },
        {
          name: 'value',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'Valor (ej: "Moda-Vanguardia", "3 Meses")',
          },
        },
      ],
      admin: {
        description: 'Información del proyecto (Cliente, Servicios, Duración, Tecnologías, etc.)',
      },
    },
  ],
}
