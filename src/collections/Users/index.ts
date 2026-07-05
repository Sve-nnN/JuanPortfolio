import type { CollectionConfig } from 'payload'

import { slugField } from '@/fields/slug'
import { seoFields } from '@/utilities/seo/seoFields'

import type { CollectionBeforeChangeHook } from 'payload'

const slugify = (s: string) =>
  String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

const ensureUniqueSlug: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  // Only run for create/update
  const payload = req.payload
  const payloadData = data as Record<string, unknown>
  const name = (payloadData.name as string) || ''
  if (!name) return data

  // Allow explicit slug if provided in data
  let desired = (payloadData.slug as string) || slugify(name)

  // If there are existing docs with the same slug, allow it only if all of them are the same document being updated
  const where = { slug: { equals: desired } }
  const found = await payload.find({ collection: 'users', where, limit: 10, depth: 0 })
  if (found && found.totalDocs > 0) {
    const incomingId = (payloadData.id as string) || (originalDoc && (originalDoc.id as string))

    // If operation is update and the only doc(s) found correspond to the same incoming id, allow
    const others = found.docs?.filter((d) => String(d.id) !== String(incomingId)) || []
    if (operation === 'update' && incomingId && others.length === 0) {
      return { ...data, slug: desired }
    }

    // Otherwise append a short suffix to make it unique
    let i = 1
    while (i <= 5) {
      const alt = `${desired}-${i}`
      const res = await payload.find({
        collection: 'users',
        where: { slug: { equals: alt } },
        limit: 1,
      })
      if (!res || res.totalDocs === 0) {
        desired = alt
        break
      }
      i += 1
    }
    // if still colliding after a few attempts, fall back to timestamp suffix (very low collision probability)
    if (i > 5) {
      desired = `${desired}-${Date.now()}`
    }
  }

  return { ...data, slug: desired }
}

import { admins, adminsField } from '../../access/admins'
import { adminsAndUser } from '../../access/adminsAndUser'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: admins,
    create: admins,
    delete: admins,
    read: adminsAndUser,
    update: adminsAndUser,
  },
  admin: {
    group: ADMIN_GROUP.SITIO,
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  auth: true,
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Perfil',
          fields: [
            { name: 'name', type: 'text', required: true },

            {
              name: 'role',
              type: 'text',
              access: {
                create: adminsField,
                read: adminsField,
                update: adminsField,
              },
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
              name: 'credentials',
              type: 'richText',
              label: 'Credenciales y Educación (Legacy)',
              admin: {
                description: 'DEPRECADO: Usa el campo Education arriba. Este campo se mantendrá para compatibilidad.',
                condition: () => false, // Hide from UI
              },
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
            slugField(),
            {
              name: 'liveUrl',
              type: 'ui',
              admin: {
                position: 'sidebar',
                components: {
                  Field: '@/components/admin/LiveUrlLink',
                },
              },
            },
            {
              name: 'primaryKeyword',
              type: 'relationship',
              relationTo: 'keyword-metrics',
              localized: true,
              label: {
                en: 'Target Keyword',
                es: 'Keyword Objetivo',
              },
              admin: {
                position: 'sidebar',
              },
            },
          ],
        },
        {
          label: 'SEO',
          fields: [...seoFields()],
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [ensureUniqueSlug],
  },
  timestamps: true,
}

export default Users
