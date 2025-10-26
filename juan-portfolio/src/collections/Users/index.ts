import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { slugField } from '@/fields/slug'
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

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'text',
      label: 'Cargo / Role',
    },
    {
      name: 'bio',
      type: 'textarea',
      localized: true,
      label: { en: 'Bio', es: 'Biografía' },
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
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    slugField(),
  ],
  hooks: {
    beforeChange: [ensureUniqueSlug],
  },
  timestamps: true,
}
