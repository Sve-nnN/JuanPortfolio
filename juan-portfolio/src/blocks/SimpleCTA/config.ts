import type { Block } from 'payload'

export const SimpleCTA: Block = {
  slug: 'simpleCta',
  interfaceName: 'SimpleCtaBlock',
  fields: [
    {
      name: 'text',
      type: 'text',
      localized: true,
      admin: {
        description: 'Texto del CTA (opcional)',
      },
    },
    {
      name: 'label',
      type: 'text',
      localized: true,
      required: true,
      admin: {
        description: 'Texto del botón',
      },
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: {
        description: 'URL del botón',
      },
    },
    {
      name: 'backgroundColor',
      type: 'select',
      defaultValue: 'black',
      options: [
        { label: 'Negro', value: 'black' },
        { label: 'Primario', value: 'primary' },
        { label: 'Gris', value: 'gray' },
      ],
      admin: {
        description: 'Color de fondo de la sección',
      },
    },
  ],
  labels: {
    singular: {
      en: 'Simple CTA',
      es: 'CTA Simple',
    },
    plural: {
      en: 'Simple CTAs',
      es: 'CTAs Simples',
    },
  },
}
