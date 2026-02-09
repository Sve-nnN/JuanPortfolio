import type { CollectionConfig } from 'payload'

const Clients: CollectionConfig = {
  slug: 'clients',
  labels: {
    singular: 'Client',
    plural: 'Clients',
  },
  admin: {
    useAsTitle: 'name',
  },
  hooks: {
    beforeValidate: [
      ({ data, req, operation }) => {
        if ('dni' in data) {
          delete data['dni']
        }
        return data
      },
    ],
    beforeChange: [
      ({ data, operation }) => {
        return data
      }
    ],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nombre (Título)',
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Logo (Imagen)',
    },
    {
      name: 'url',
      type: 'text',
      label: 'URL',
    },
  ],
}



export default Clients
