import { CollectionConfig } from 'payload/types'

const Works: CollectionConfig = {
  slug: 'works',
  labels: {
    singular: 'Work',
    plural: 'Works',
  },
  admin: {
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
    },
    {
      name: 'excerpt',
      type: 'textarea',
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'label', type: 'text' }],
    },
    {
      name: 'caseStudyUrl',
      type: 'text',
    },
  ],
}

export default Works
