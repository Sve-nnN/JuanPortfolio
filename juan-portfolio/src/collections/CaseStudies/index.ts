import type { CollectionConfig } from 'payload'

const CaseStudies: CollectionConfig = {
  slug: 'case-studies',
  labels: {
    singular: 'Case Study',
    plural: 'Case Studies',
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

export default CaseStudies
