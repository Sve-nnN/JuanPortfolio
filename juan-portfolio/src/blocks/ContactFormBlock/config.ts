import type { Block } from 'payload'

export const ContactFormBlock: Block = {
  slug: 'contactForm',
  interfaceName: 'ContactFormBlock',
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
      admin: {
        description: 'Texto pequeño sobre el título',
      },
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      admin: {
        description: 'Título del formulario',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Descripción del formulario',
      },
    },
    {
      name: 'submitLabel',
      type: 'text',
      localized: true,
      defaultValue: 'Enviar mensaje',
      admin: {
        description: 'Texto del botón de enviar',
      },
    },
    {
      name: 'contactInfo',
      type: 'array',
      fields: [
        {
          name: 'icon',
          type: 'select',
          required: true,
          options: [
            { label: 'Email (Mail)', value: 'mail' },
            { label: 'Teléfono (Phone)', value: 'phone' },
            { label: 'Ubicación (MapPin)', value: 'map-pin' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'GitHub', value: 'github' },
          ],
        },
        {
          name: 'title',
          type: 'text',
          localized: true,
          required: true,
        },
        {
          name: 'value',
          type: 'text',
          localized: true,
          required: true,
        },
        {
          name: 'href',
          type: 'text',
          admin: {
            description: 'URL o enlace (ej: mailto:, tel:, https://)',
          },
        },
      ],
      admin: {
        description: 'Información de contacto mostrada al lado del formulario',
      },
    },
  ],
  labels: {
    singular: {
      en: 'Contact Form',
      es: 'Formulario de Contacto',
    },
    plural: {
      en: 'Contact Forms',
      es: 'Formularios de Contacto',
    },
  },
}
