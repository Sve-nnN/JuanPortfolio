import type { CollectionConfig } from 'payload'
import { ADMIN_GROUP } from '@/utilities/adminGroups'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: {
    singular: 'Testimonial',
    plural: 'Testimonials',
  },
  admin: {
    group: ADMIN_GROUP.MARKETING,
    useAsTitle: 'author',
    defaultColumns: ['author', 'company', 'createdAt'],
  },
  fields: [
    {
      name: 'author',
      type: 'text',
      required: true,
      label: 'Nombre del autor',
    },
    {
      name: 'company',
      type: 'text',
      localized: true,
      label: 'Empresa/Organización',
    },
    {
      name: 'role',
      type: 'text',
      localized: true,
      label: 'Rol o cargo',
    },
    {
      name: 'testimonial',
      type: 'textarea',
      required: true,
      localized: true,
      label: 'Testimonio',
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      label: 'Avatar o foto',
    },
    {
      name: 'rating',
      type: 'number',
      min: 1,
      max: 5,
      label: 'Calificación (opcional)',
    },
  ],
}

export default Testimonials
