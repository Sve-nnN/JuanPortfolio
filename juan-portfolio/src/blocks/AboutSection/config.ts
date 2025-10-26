import type { Block } from 'payload'

export const AboutSection: Block = {
  slug: 'aboutSection',
  interfaceName: 'AboutSectionBlock',
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
      admin: {
        description: 'Texto pequeño sobre el título (ej: "Sobre mí")',
      },
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      admin: {
        description: 'Título de la sección',
      },
    },
    {
      name: 'paragraphs',
      type: 'array',
      localized: true,
      fields: [
        {
          name: 'text',
          type: 'textarea',
          localized: true,
          required: true,
        },
      ],
      admin: {
        description: 'Párrafos de texto',
      },
    },
    {
      name: 'ctaLabel',
      type: 'text',
      localized: true,
      admin: {
        description: 'Texto del CTA (ej: "Hablemos de tu proyecto")',
      },
    },
    {
      name: 'ctaUrl',
      type: 'text',
      admin: {
        description: 'URL del CTA',
      },
    },
    {
      name: 'features',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      fields: [
        {
          name: 'icon',
          type: 'select',
          required: true,
          options: [
            { label: 'Rayo (Zap)', value: 'zap' },
            { label: 'Monitor', value: 'monitor' },
            { label: 'Bombilla (Lightbulb)', value: 'lightbulb' },
            { label: 'Tendencia (TrendingUp)', value: 'trending-up' },
            { label: 'Cohete (Rocket)', value: 'rocket' },
            { label: 'Escudo (Shield)', value: 'shield' },
          ],
          admin: {
            description: 'Icono para la característica',
          },
        },
        {
          name: 'title',
          type: 'text',
          localized: true,
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
          required: true,
        },
      ],
      admin: {
        description: 'Características o beneficios mostrados en grid',
      },
    },
  ],
  labels: {
    singular: {
      en: 'About Section',
      es: 'Sección Sobre mí',
    },
    plural: {
      en: 'About Sections',
      es: 'Secciones Sobre mí',
    },
  },
}
