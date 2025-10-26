import type { Block } from 'payload'

export const HeroHome: Block = {
  slug: 'heroHome',
  interfaceName: 'HeroHomeBlock',
  fields: [
    {
      name: 'badge',
      type: 'text',
      localized: true,
      admin: {
        description: 'Pequeño badge o etiqueta que aparece sobre el título',
      },
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      admin: {
        description: 'Título principal del hero',
      },
    },
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
      admin: {
        description: 'Subtítulo con gradiente',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Descripción debajo del título',
      },
    },
    {
      name: 'richText',
      type: 'richText',
      localized: true,
      admin: {
        description: 'Rich text alternativo (reemplaza título/subtítulo/descripción si se usa)',
      },
    },
    {
      name: 'primaryCta',
      type: 'group',
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
      admin: {
        description: 'Botón principal (CTA primario)',
      },
    },
    {
      name: 'secondaryCta',
      type: 'group',
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
        },
        {
          name: 'url',
          type: 'text',
        },
      ],
      admin: {
        description: 'Botón secundario (opcional)',
      },
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        description: 'Imagen o video del hero',
      },
    },
    {
      name: 'mediaPosition',
      type: 'select',
      defaultValue: 'right',
      options: [
        { label: 'Izquierda', value: 'left' },
        { label: 'Derecha', value: 'right' },
      ],
      admin: {
        description: 'Posición de la imagen en desktop',
      },
    },
  ],
  labels: {
    singular: {
      en: 'Hero Home',
      es: 'Hero Principal',
    },
    plural: {
      en: 'Hero Homes',
      es: 'Heros Principales',
    },
  },
}
