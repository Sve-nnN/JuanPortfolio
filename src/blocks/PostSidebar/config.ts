import type { Block } from 'payload'

export const PostSidebar: Block = {
  slug: 'postSidebar',
  interfaceName: 'PostSidebarBlock',
  fields: [
    {
      name: 'banners',
      type: 'relationship',
      relationTo: 'ad-banners',
      hasMany: true,
      admin: {
        description: 'Banners publicitarios para el sidebar',
      },
    },
    {
      name: 'position',
      type: 'select',
      defaultValue: 'right',
      options: [
        { label: 'Izquierda', value: 'left' },
        { label: 'Derecha', value: 'right' },
      ],
      admin: {
        description: 'Posición del sidebar',
      },
    },
    {
      name: 'sticky',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Hacer el sidebar sticky (pegado al scroll)',
      },
    },
  ],
  labels: {
    singular: {
      en: 'Post Sidebar',
      es: 'Sidebar de Post',
    },
    plural: {
      en: 'Post Sidebars',
      es: 'Sidebars de Post',
    },
  },
}
