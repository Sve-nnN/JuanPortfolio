import type { GlobalConfig } from 'payload'
import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'
import { ADMIN_GROUP } from '@/utilities/adminGroups'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: {
    group: ADMIN_GROUP.SITIO,
  },
  access: {
    read: anyone,
    update: authenticated,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: {
            en: 'Organization',
            es: 'Organización',
          },
          fields: [
            {
              name: 'organizationName',
              type: 'text',
              required: true,
              label: {
                en: 'Organization Name',
                es: 'Nombre de la Organización',
              },
              admin: {
                description: {
                  en: 'Official name of your organization/business',
                  es: 'Nombre oficial de tu organización/negocio',
                },
              },
            },
            {
              name: 'organizationDescription',
              type: 'textarea',
              label: {
                en: 'Description',
                es: 'Descripción',
              },
              admin: {
                description: {
                  en: 'Brief description of your organization',
                  es: 'Descripción breve de tu organización',
                },
              },
            },
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
              label: {
                en: 'Logo',
                es: 'Logo',
              },
              admin: {
                description: {
                  en: 'Your organization logo for structured data',
                  es: 'Logo de tu organización para datos estructurados',
                },
              },
            },
            {
              name: 'siteUrl',
              type: 'text',
              required: true,
              label: {
                en: 'Site URL',
                es: 'URL del Sitio',
              },
              admin: {
                description: {
                  en: 'Your website URL (e.g., https://example.com)',
                  es: 'URL de tu sitio web (ej: https://ejemplo.com)',
                },
              },
            },
            {
              name: 'searchUrl',
              type: 'text',
              label: {
                en: 'Search URL',
                es: 'URL de Búsqueda',
              },
              admin: {
                description: {
                  en: 'URL for your site search page (e.g., /search)',
                  es: 'URL de tu página de búsqueda (ej: /search)',
                },
              },
            },
          ],
        },
        {
          label: {
            en: 'Social Profiles',
            es: 'Perfiles Sociales',
          },
          fields: [
            {
              name: 'socialProfiles',
              type: 'array',
              label: {
                en: 'Social Profile URLs',
                es: 'URLs de Perfiles Sociales',
              },
              fields: [
                {
                  name: 'platform',
                  type: 'select',
                  options: [
                    { label: 'Twitter/X', value: 'twitter' },
                    { label: 'Facebook', value: 'facebook' },
                    { label: 'Instagram', value: 'instagram' },
                    { label: 'LinkedIn', value: 'linkedin' },
                    { label: 'YouTube', value: 'youtube' },
                    { label: 'GitHub', value: 'github' },
                    { label: 'TikTok', value: 'tiktok' },
                    { label: 'Other', value: 'other' },
                  ],
                  required: true,
                  admin: {},
                },
                {
                  name: 'url',
                  type: 'text',
                  required: true,
                  label: {
                    en: 'Profile URL',
                    es: 'URL del Perfil',
                  },
                  admin: {
                    description: {
                      en: 'Full URL to your social profile',
                      es: 'URL completa de tu perfil social',
                    },
                  },
                },
              ],
            },
          ],
        },
        {
          label: {
            en: 'Contact',
            es: 'Contacto',
          },
          fields: [
            {
              name: 'contactType',
              type: 'select',
              options: [
                { label: 'Customer Service', value: 'customer service' },
                { label: 'Technical Support', value: 'technical support' },
                { label: 'Sales', value: 'sales' },
                { label: 'General', value: 'general' },
              ],
              label: {
                en: 'Contact Type',
                es: 'Tipo de Contacto',
              },
              admin: {},
            },
            {
              name: 'contactEmail',
              type: 'email',
              label: {
                en: 'Contact Email',
                es: 'Email de Contacto',
              },
            },
            {
              name: 'contactPhone',
              type: 'text',
              label: {
                en: 'Contact Phone',
                es: 'Teléfono de Contacto',
              },
              admin: {
                description: {
                  en: 'Phone number in international format (e.g., +1-555-555-5555)',
                  es: 'Número de teléfono en formato internacional (ej: +1-555-555-5555)',
                },
              },
            },
          ],
        },
      ],
    },
  ],
}
