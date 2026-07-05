import type { GlobalConfig } from 'payload'
import { revalidateLLM } from './hooks/revalidateLLM'
import { ADMIN_GROUP } from '@/utilities/adminGroups'

export const LLM: GlobalConfig = {
  slug: 'llm',
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [revalidateLLM],
  },
  admin: {
    group: ADMIN_GROUP.SITIO,
  },
  fields: [
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      localized: true,
      label: 'Resumen para LLMs',
      admin: {
        description: 'Breve descripción de qué es este sitio para inteligencias artificiales.',
      },
    },
    {
      name: 'fullContent',
      type: 'textarea',
      localized: true,
      label: 'Contenido Completo (Markdown)',
      admin: {
        description: 'El cuerpo principal del archivo llms.txt. Puedes usar markdown.',
      },
    },
    {
      name: 'resources',
      type: 'array',
      label: 'Recursos y Enlaces Clave',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'text',
        },
      ],
    },
  ],
}
