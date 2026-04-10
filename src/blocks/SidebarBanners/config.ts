import type { Block } from 'payload'

export const SidebarBannersBlock: Block = {
  slug: 'sidebarBanners',
  interfaceName: 'SidebarBannersBlock',
  fields: [
    {
      name: 'banners',
      type: 'relationship',
      relationTo: 'ad-banners',
      hasMany: true,
      admin: {
        description: 'Banners publicitarios para mostrar en el sidebar',
      },
    },
    {
      name: 'position',
      type: 'select',
      defaultValue: 'right',
      options: [
        { label: 'Derecha (desktop)', value: 'right' },
        { label: 'Izquierda (desktop)', value: 'left' },
      ],
      admin: {
        description: 'Posición del sidebar en desktop',
      },
    },
    {
      name: 'sticky',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Hacer el sidebar sticky (fijo al scroll)',
      },
    },
  ],
  labels: {
    singular: {
      en: 'Sidebar Banners',
      es: 'Banners de Sidebar',
    },
    plural: {
      en: 'Sidebar Banners',
      es: 'Banners de Sidebar',
    },
  },
}
