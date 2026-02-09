import type { CollectionConfig } from 'payload'

export const ClientsCollection: CollectionConfig = {
  slug: 'clients',
  labels: {
    singular: 'Client',
    plural: 'Clients',
  },
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'url',
      type: 'text',
    },
    /* {
      name: 'order',
      type: 'number',
    }, */
  ],
}
