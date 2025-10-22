import type { Block } from 'payload'

export const ClientsCarousel: Block = {
  slug: 'clientsCarousel',
  interfaceName: 'ClientsCarousel',
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      name: 'clients',
      type: 'array',
      fields: [
        { name: 'logo', type: 'upload', relationTo: 'media' },
        { name: 'href', type: 'text' },
      ],
      maxRows: 20,
    },
  ],
}

export default ClientsCarousel
