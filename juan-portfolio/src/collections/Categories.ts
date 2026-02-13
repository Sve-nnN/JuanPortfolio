import type { CollectionConfig } from 'payload'
import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { slugField } from '../fields/slug'
import { seoFields } from '../plugins/seo/fields/seoFields'

import type { Field } from 'payload'

function getCategoryFields(): Field[] {
  return [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: {
        en: 'Name',
        es: 'Nombre',
      },
      admin: {},
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
      localized: true,
      label: {
        en: 'Description',
        es: 'Descripción',
      },
      admin: {},
    },
    slugField('title', { admin: { position: undefined } }),
    {
      name: 'liveUrl',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/admin/LiveUrlLink',
        },
      },
    },
    {
      name: 'faqs',
      label: { en: 'FAQs', es: 'Preguntas Frecuentes' },
      type: 'array',
      fields: [
        {
          name: 'question',
          type: 'text',
          localized: true,
          label: { en: 'Question', es: 'Pregunta' },
          required: true,
          admin: {},
        },
        {
          name: 'answer',
          type: 'textarea',
          localized: true,
          label: { en: 'Answer', es: 'Respuesta' },
          required: true,
          admin: {},
        },
      ] as import('payload').Field[],
      minRows: 0,
      maxRows: 20,
    },
  ]
}

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Categoría',
          fields: getCategoryFields(),
        },
        {
          label: 'SEO',
          fields: [...seoFields()],
        },
      ],
    },
  ],
}
