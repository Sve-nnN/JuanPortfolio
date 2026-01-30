import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'columns',
      type: 'array',
      label: 'Columnas de Navegación',
      minRows: 1,
      maxRows: 4,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          label: 'Título de Columna',
        },
        {
          name: 'navItems',
          type: 'array',
          fields: [
            link({
              appearances: false,
            }),
          ],
          admin: {
            components: {
              RowLabel: '@/Footer/RowLabel#RowLabel',
            },
          },
        },
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: 'Redes Sociales',
      fields: [
        {
          name: 'platform',
          type: 'select',
          options: [
            { label: 'GitHub', value: 'github' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'Twitter', value: 'twitter' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'YouTube', value: 'youtube' },
          ],
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          label: 'URL',
        },
      ],
    },
    {
      name: 'copyright',
      type: 'text',
      label: 'Texto de Copyright',
      defaultValue: 'Juan Carlos Angulo. Todos los derechos reservados.',
    },
    // Legacy support
    {
      name: 'navItems',
      type: 'array',
      admin: {
        hidden: true,
      },
      fields: [
        link({
          appearances: false,
        }),
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
