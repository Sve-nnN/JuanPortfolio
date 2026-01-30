import type { Block } from 'payload'

export const BlogArchiveHeader: Block = {
  slug: 'blogArchiveHeader',
  interfaceName: 'BlogArchiveHeaderBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      // required: true, // Relaxed validation to prevent save errors
      localized: true,
      defaultValue: 'Desde mi Blog',
      admin: {
        description: 'Título de la página de archivo',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Descripción de la página',
      },
    },
    {
      name: 'showCategoryFilters',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Mostrar filtros de categorías',
      },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Imagen de fondo (usará fallback si no se selecciona)',
      },
    },
    {
      name: 'alignment',
      type: 'select',
      defaultValue: 'end',
      options: [
        { label: 'Izquierda', value: 'start' },
        { label: 'Centro', value: 'center' },
        { label: 'Derecha', value: 'end' },
      ],
      admin: {
        description: 'Alineación del contenido',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        description: 'Categorías a mostrar en los filtros (dejar vacío para mostrar todas)',
        condition: (data) => data.showCategoryFilters,
      },
    },
  ],
}
