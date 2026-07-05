import type { CollectionConfig } from 'payload'
import { ADMIN_GROUP } from '@/utilities/adminGroups'

const Works: CollectionConfig = {
  slug: 'works',
  labels: {
    singular: 'Work',
    plural: 'Works',
  },
  admin: {
    group: ADMIN_GROUP.MARKETING,
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'excerpt',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'label', type: 'text', localized: true }],
    },
    {
      name: 'caseStudyUrl',
      type: 'text',
    },
  ],
}

export default Works
