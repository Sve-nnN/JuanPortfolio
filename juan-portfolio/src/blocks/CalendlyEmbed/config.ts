import type { Block } from 'payload'

export const CalendlyEmbed: Block = {
  slug: 'calendlyEmbed',
  interfaceName: 'CalendlyEmbedBlock',
  fields: [
    {
      name: 'calendlyUrl',
      type: 'text',
      required: true,
      admin: {
        description: 'URL del evento Calendly (ej: https://calendly.com/tu-usuario/30min)',
        placeholder: 'https://calendly.com/usuario/evento',
      },
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description: 'Título opcional sobre el widget',
      },
    },
    {
      name: 'subtitle',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Descripción opcional bajo el título',
      },
    },
    {
      name: 'height',
      type: 'select',
      defaultValue: 'default',
      options: [
        { label: 'Compacto (500px)', value: 'compact' },
        { label: 'Estándar (700px)', value: 'default' },
        { label: 'Alto (900px)', value: 'tall' },
      ],
      admin: {
        description: 'Altura del widget de calendario',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'hideEventTypeDetails',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Ocultar detalles del tipo de evento',
            width: '50%',
          },
        },
        {
          name: 'hideGdprBanner',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Ocultar banner GDPR',
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Personalización de colores (hex sin #)',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'backgroundColor',
              type: 'text',
              admin: {
                description: 'Color de fondo (ej: ffffff)',
                placeholder: 'ffffff',
                width: '33%',
              },
            },
            {
              name: 'primaryColor',
              type: 'text',
              admin: {
                description: 'Color primario (ej: 00a2ff)',
                placeholder: '00a2ff',
                width: '33%',
              },
            },
            {
              name: 'textColor',
              type: 'text',
              admin: {
                description: 'Color de texto (ej: 4d5055)',
                placeholder: '4d5055',
                width: '33%',
              },
            },
          ],
        },
      ],
    },
  ],
  labels: {
    singular: {
      en: 'Calendly Embed',
      es: 'Calendly Embed',
    },
    plural: {
      en: 'Calendly Embeds',
      es: 'Calendly Embeds',
    },
  },
}
