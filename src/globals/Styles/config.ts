import type { GlobalConfig } from 'payload'
import { ADMIN_GROUP } from '@/utilities/adminGroups'

export const Styles: GlobalConfig = {
  slug: 'styles',
  label: 'Estilos Globales',
  admin: {
    group: ADMIN_GROUP.SITIO,
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'colors',
      type: 'group',
      label: 'Colores',
      fields: [
        {
          name: 'accent',
          type: 'text',
          label: 'Color de Acento (Hex)',
          defaultValue: '#007bff', // Example default
        },
        {
          name: 'text',
          type: 'text',
          label: 'Color de Texto (Hex)',
          defaultValue: '#212529', // Example default
        },
        {
          name: 'muted',
          type: 'text',
          label: 'Color Apagado (Hex)',
          defaultValue: '#6c757d', // Example default
        },
        {
          name: 'border',
          type: 'text',
          label: 'Color de Borde (Hex)',
          defaultValue: '#dee2e6', // Example default
        },
        {
          name: 'buttonBackground',
          type: 'text',
          label: 'Color de Fondo del Botón (Hex)',
          defaultValue: '#007bff', // Example default
        },
        {
          name: 'buttonText',
          type: 'text',
          label: 'Color de Texto del Botón (Hex)',
          defaultValue: '#ffffff', // Example default
        },
        {
          name: 'secondaryButtonBackground',
          type: 'text',
          label: 'Color de Fondo del Botón Secundario (Hex)',
          defaultValue: '#6c757d', // Example default
        },
        {
          name: 'secondaryButtonText',
          type: 'text',
          label: 'Color de Texto del Botón Secundario (Hex)',
          defaultValue: '#ffffff', // Example default
        },
      ],
    },
    {
      name: 'fonts',
      type: 'group',
      label: 'Fuentes',
      fields: [
        {
          name: 'primary',
          type: 'text',
          label: 'Fuente Primaria (CSS font-family)',
          defaultValue: 'Inter, sans-serif', // Example default
        },
        {
          name: 'secondary',
          type: 'text',
          label: 'Fuente Secundaria (CSS font-family)',
          defaultValue: 'Roboto, sans-serif', // Example default
        },
      ],
    },
    {
      name: 'borderRadius',
      type: 'text',
      label: 'Radio del Borde (CSS value, e.g., 0.25rem, 4px)',
      defaultValue: '0.25rem', // Example default
    },
  ],
}
