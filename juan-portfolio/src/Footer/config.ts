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
      type: 'tabs',
      tabs: [
        {
          label: 'Contenido Principal',
          fields: [
            {
              name: 'brand',
              type: 'group',
              label: 'Marca / Logo',
              fields: [
                {
                  name: 'logoText',
                  type: 'text',
                  label: 'Texto del Logo',
                  defaultValue: 'JCA',
                  required: true,
                },
                {
                  name: 'logoImage',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Imagen del Logo (Opcional)',
                },
                {
                  name: 'description',
                  type: 'textarea',
                  label: 'Descripción',
                  defaultValue:
                    'Desarrollador Web & Especialista SEO. Creando experiencias digitales rápidas, accesibles y de alto impacto.',
                },
              ],
            },
            {
              name: 'mainNav',
              type: 'group',
              label: 'Navegación Principal',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  label: 'Título de Sección',
                  defaultValue: 'Navegación',
                },
                {
                  name: 'navItems',
                  type: 'array',
                  label: 'Items de Navegación',
                  fields: [
                    link({
                      appearances: false,
                    }),
                  ],
                  admin: {
                    initCollapsed: true,
                    components: {
                      RowLabel: '@/Footer/RowLabel#RowLabel',
                    },
                  },
                },
              ],
            },
            {
              name: 'latestPosts',
              type: 'group',
              label: 'Últimos Posts',
              fields: [
                {
                  name: 'show',
                  type: 'checkbox',
                  label: 'Mostrar Sección',
                  defaultValue: true,
                },
                {
                  name: 'title',
                  type: 'text',
                  label: 'Título de Sección',
                  defaultValue: 'Últimos Posts',
                  admin: {
                    condition: (_, siblingData) => siblingData?.show,
                  },
                },
                {
                  name: 'limit',
                  type: 'number',
                  label: 'Límite de Posts',
                  defaultValue: 4,
                  min: 1,
                  max: 10,
                  admin: {
                    condition: (_, siblingData) => siblingData?.show,
                  },
                },
                {
                  name: 'viewAllText',
                  type: 'text',
                  label: 'Texto "Ver todos"',
                  defaultValue: 'Ver todos los posts',
                  admin: {
                    condition: (_, siblingData) => siblingData?.show,
                  },
                },
                link({
                  appearances: false,
                  overrides: {
                    name: 'viewAllLink',
                    label: 'Enlace "Ver todos"',
                    admin: {
                      condition: (_, siblingData) => siblingData?.show,
                    },
                  },
                }),
              ],
            },
            {
              name: 'caseStudies',
              type: 'group',
              label: 'Casos de Estudio',
              fields: [
                {
                  name: 'show',
                  type: 'checkbox',
                  label: 'Mostrar Sección',
                  defaultValue: true,
                },
                {
                  name: 'title',
                  type: 'text',
                  label: 'Título de Sección',
                  defaultValue: 'Casos',
                  admin: {
                    condition: (_, siblingData) => siblingData?.show,
                  },
                },
                {
                  name: 'limit',
                  type: 'number',
                  label: 'Límite de Casos',
                  defaultValue: 4,
                  min: 1,
                  max: 10,
                  admin: {
                    condition: (_, siblingData) => siblingData?.show,
                  },
                },
                {
                  name: 'viewAllText',
                  type: 'text',
                  label: 'Texto "Ver todos"',
                  defaultValue: 'Ver todos',
                  admin: {
                    condition: (_, siblingData) => siblingData?.show,
                  },
                },
                link({
                  appearances: false,
                  overrides: {
                    name: 'viewAllLink',
                    label: 'Enlace "Ver todos"',
                    admin: {
                      condition: (_, siblingData) => siblingData?.show,
                    },
                  },
                }),
              ],
            },
          ],
        },
        {
          label: 'Redes y Copyright',
          fields: [
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
            {
              name: 'bottomNav',
              type: 'array',
              label: 'Enlaces Inferiores (Privacidad, Términos, etc.)',
              fields: [
                link({
                  appearances: false,
                }),
              ],
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: '@/Footer/RowLabel#RowLabel',
                },
              },
            },
          ],
        },
        {
          label: 'Configuración Avanzada / Legacy',
          fields: [
            {
              name: 'columns',
              type: 'array',
              label: 'Columnas Extra (Legacy)',
              minRows: 0,
              maxRows: 4,
              admin: {
                description:
                  'Use las pestañas principales para configurar las columnas estándar. Use esto solo si necesita columnas adicionales personalizadas.',
              },
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
            // Legacy support hidden field
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
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
