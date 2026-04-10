import type { Block } from 'payload'

export const TableOfContentsBlock: Block = {
  slug: 'tableOfContents',
  interfaceName: 'TableOfContentsBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      defaultValue: 'Tabla de contenidos',
      admin: {
        description: 'Título de la tabla de contenidos',
      },
    },
    {
      name: 'position',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: 'Izquierda', value: 'left' },
        { label: 'Derecha', value: 'right' },
        { label: 'Arriba (móvil)', value: 'top' },
      ],
      admin: {
        description: 'Posición del TOC en desktop',
      },
    },
    {
      name: 'sticky',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Hacer el TOC sticky (pegado al scroll)',
      },
    },
    {
      name: 'minHeadingLevel',
      type: 'select',
      defaultValue: '2',
      options: [
        { label: 'H2', value: '2' },
        { label: 'H3', value: '3' },
      ],
      admin: {
        description: 'Nivel mínimo de encabezado a incluir',
      },
    },
  ],
  labels: {
    singular: {
      en: 'Table of Contents',
      es: 'Tabla de Contenidos',
    },
    plural: {
      en: 'Tables of Contents',
      es: 'Tablas de Contenidos',
    },
  },
}
