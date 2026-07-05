import type { CollectionConfig } from 'payload'

import { slugField } from '@/fields/slug'
import { seoFields } from '@/utilities/seo/seoFields'
import { ADMIN_GROUP } from '@/utilities/adminGroups'

/**
 * Dedicated public `Authors` collection (Phase 56, AUTHORS-01).
 *
 * Author-facing parity with the `users` (auth) collection, EXCLUDING everything
 * auth-related (email/password/`auth: true`), the deprecated `credentials`, the
 * `liveUrl` ui, `primaryKeyword`, and the `users`-bound `ensureUniqueSlug` hook
 * (the `unique` flag on `slugField` already enforces uniqueness).
 *
 * `read: () => true` is intentional and correct: this collection holds NO auth
 * data (email/password are never migrated), only content already public via the
 * author page. Being public removes the privacy reason for the `populatedAuthors`
 * workaround (RESEARCH §D / Security V4). The old `authors→users` relationship on
 * Posts stays live as the fallback source until Phase 58.
 */
export const Authors: CollectionConfig = {
  slug: 'authors',
  access: {
    read: () => true,
  },
  admin: {
    group: ADMIN_GROUP.CONTENIDO,
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug'],
  },
  timestamps: true,
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Perfil',
          fields: [
            { name: 'name', type: 'text', required: true },
            {
              // `role` mirrors Users.role but WITHOUT the adminsField access
              // control — here it is a plain public text field.
              name: 'role',
              type: 'text',
              label: 'Cargo / Role',
            },
            {
              name: 'jobTitle',
              type: 'text',
              localized: true,
              label: 'Título Profesional',
              admin: {
                description: 'Ej: Full-Stack Developer, Senior Software Engineer',
              },
            },
            { name: 'bio', type: 'textarea', localized: true, label: { en: 'Bio', es: 'Biografía' } },
            {
              name: 'expertise',
              type: 'array',
              label: 'Áreas de Expertise',
              admin: {
                description: 'Temas en los que eres experto (mejora E-E-A-T)',
              },
              fields: [
                {
                  name: 'topic',
                  type: 'text',
                  required: true,
                  label: 'Tema',
                },
              ],
            },
            {
              name: 'socialMedia',
              type: 'group',
              label: 'Redes Sociales',
              admin: {
                description: 'Links a perfiles profesionales (mejora autoridad)',
              },
              fields: [
                { name: 'linkedin', type: 'text', label: 'LinkedIn URL' },
                { name: 'github', type: 'text', label: 'GitHub URL' },
                { name: 'twitter', type: 'text', label: 'Twitter/X URL' },
                { name: 'website', type: 'text', label: 'Website URL' },
              ],
            },
            {
              name: 'education',
              type: 'array',
              label: 'Educación y Certificaciones',
              admin: {
                description: 'Títulos académicos, certificaciones profesionales, cursos relevantes',
              },
              fields: [
                {
                  name: 'degree',
                  type: 'text',
                  required: true,
                  label: 'Título / Certificación',
                  admin: {
                    description: 'Ej: Master en Ingeniería, AWS Certified Developer',
                  },
                },
                {
                  name: 'institution',
                  type: 'text',
                  label: 'Institución / Organización',
                  admin: {
                    description: 'Ej: Universidad XYZ, Amazon Web Services',
                  },
                },
                {
                  name: 'logo',
                  type: 'upload',
                  label: 'Logo de la Institución',
                  relationTo: 'media',
                  admin: {
                    description: 'Logo pequeño de la institución (opcional, se mostrará junto al nombre)',
                  },
                },
                {
                  name: 'startDate',
                  type: 'date',
                  label: 'Fecha de Inicio',
                  admin: {
                    date: {
                      pickerAppearance: 'monthOnly',
                    },
                  },
                },
                {
                  name: 'endDate',
                  type: 'date',
                  label: 'Fecha de Finalización',
                  admin: {
                    description: 'Dejar vacío si está en curso',
                    date: {
                      pickerAppearance: 'monthOnly',
                    },
                  },
                },
                {
                  name: 'certificate',
                  type: 'upload',
                  label: 'Certificado / Diploma',
                  relationTo: 'media',
                  admin: {
                    description: 'Imagen del certificado o diploma (opcional)',
                  },
                },
                {
                  name: 'description',
                  type: 'textarea',
                  label: 'Descripción',
                  admin: {
                    description: 'Detalles adicionales, logros, especialización',
                  },
                },
              ],
            },
            {
              name: 'experience',
              type: 'array',
              label: 'Experiencia',
              fields: [
                { name: 'company', type: 'text' },
                { name: 'role', type: 'text' },
                { name: 'startDate', type: 'date' },
                { name: 'endDate', type: 'date' },
                { name: 'description', type: 'textarea' },
              ],
            },
            { name: 'avatar', type: 'upload', relationTo: 'media' },
            slugField('name'),
          ],
        },
        {
          label: 'SEO',
          fields: [...seoFields()],
        },
      ],
    },
  ],
}

export default Authors
